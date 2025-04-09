import { ordinal, rate, rating } from "openskill";
import {
  type Rating as OpenskillRating,
  type Options,
} from "openskill/dist/types";
import { type ratingEventTbl } from "../db/schema/ratingEvent";
import { type RatingSystemType, type Season } from "../db/schema/season";
import { type EloConfig } from "../types/elo";
import { getDatePartFromDate, subtractDays } from "./dateUtils";
import { type QuestEvent } from "./quest";
import { isDefined } from "./utils";

type SelectRatingEvent = typeof ratingEventTbl.$inferSelect;

type EloRating = number;
type XPRating = number;
export type Rating = number | OpenskillRating;

export interface XPConfig {
  a: number;
  b: number;
}

export interface RatingSystem<TRating> {
  defaultRating: TRating;
  rateMatch: (match: MatchWithRatings<TRating>) => PlayerWithRating<TRating>[];
  toNumber: (rating: TRating) => number;
  equals: (a: TRating | undefined, b: TRating | undefined) => boolean;
  type: RatingSystemType;
  applyEventAdjustment: (
    currentRating: TRating,
    eventType: QuestEvent<unknown>["type"],
  ) => TRating;
  eventSystemEnabled: boolean;
}

export interface PlayerWithRating<TRating> {
  player: Player;
  rating: TRating;
}

export interface PlayerWithRatingDiff<TRating> {
  player: Player;
  ratingBefore: TRating | undefined;
  ratingAfter: TRating;
  rankBefore: number | undefined;
  rankAfter: number;
}

type Winner = "Black" | "White" | "Draw";

export interface Match {
  id: number;
  whitePlayerOne: Player;
  whitePlayerTwo: Player | null;
  blackPlayerOne: Player;
  blackPlayerTwo: Player | null;
  result: Winner;
  scoreDiff: number;
  createdAt: Date;
  seasonId: number;
}

interface MatchWithRatings<TRating> {
  id: number;
  whitePlayerOne: PlayerWithRating<TRating>;
  whitePlayerTwo: PlayerWithRating<TRating> | null;
  blackPlayerOne: PlayerWithRating<TRating>;
  blackPlayerTwo: PlayerWithRating<TRating> | null;
  result: Winner;
  scoreDiff: number;
  createdAt: Date;
}

// Added type for combined item
type ChronologicalItem =
  | { type: "match"; data: Match; createdAt: Date }
  | { type: "event"; data: SelectRatingEvent; createdAt: Date };

export function getRatings<TRating>(
  matches: Match[],
  ratingEvents: SelectRatingEvent[],
  system: RatingSystem<TRating>,
): PlayerWithRating<TRating>[] {
  // Combine and sort matches and events
  const chronologicalItems: ChronologicalItem[] = [
    ...matches.map((m) => ({
      type: "match" as const,
      data: m,
      createdAt: m.createdAt,
    })),
    ...ratingEvents.map((e) => ({
      type: "event" as const,
      data: e,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const ratings = chronologicalItems.reduce(
    (currentRatings, item) => {
      if (item.type === "match") {
        return getRatingsAfterMatch(currentRatings, item.data, system);
      } else {
        return applyEventToRatings(currentRatings, item.data, system);
      }
    },
    {} as Record<string, PlayerWithRating<TRating>>,
  );

  return Object.values(ratings).toSorted(
    (a, b) => system.toNumber(b.rating) - system.toNumber(a.rating),
  );
}

export function getMatchRatingDiff<TRating>(
  matches: Match[],
  ratingEvents: SelectRatingEvent[],
  system: RatingSystem<TRating>,
): PlayerWithRatingDiff<TRating>[] {
  // Combine and sort all matches and events chronologically
  const allChronologicalItems: ChronologicalItem[] = [
    ...matches.map((m) => ({
      type: "match" as const,
      data: m,
      createdAt: m.createdAt,
    })),
    ...ratingEvents.map((e) => ({
      type: "event" as const,
      data: e,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Find the index of the target match in the full chronological list
  const targetMatch = matches[matches.length - 1]; // The last match in the input is the one we diff
  const targetMatchIndex = allChronologicalItems.findIndex(
    (item) => item.type === "match" && item.data.id === targetMatch.id,
  );

  if (targetMatchIndex === -1) {
    console.error("Target match not found in chronological items");
    return []; // Or handle error appropriately
  }

  // Items strictly *before* the target match
  const itemsBeforeTarget = allChronologicalItems.slice(0, targetMatchIndex);

  type PlayerRatingRecord = Record<string, PlayerWithRating<TRating>>;

  // Calculate ratings state *before* the target match (using itemsBeforeTarget)
  const ratingsBefore = itemsBeforeTarget.reduce((currentRatings, item) => {
    if (item.type === "match") {
      return getRatingsAfterMatch(currentRatings, item.data, system);
    } else {
      return applyEventToRatings(currentRatings, item.data, system);
    }
  }, {} as PlayerRatingRecord);

  // Find the timestamp of the target match
  const targetTimestamp = targetMatch.createdAt.getTime();

  // Find the index of the LAST item with the same or earlier timestamp as the target match
  let lastRelevantIndex = targetMatchIndex;
  for (let i = targetMatchIndex + 1; i < allChronologicalItems.length; i++) {
    if (allChronologicalItems[i].createdAt.getTime() === targetTimestamp) {
      lastRelevantIndex = i;
    } else {
      // Stop as soon as we find an item with a later timestamp
      break;
    }
  }

  // Items up to and including the last item with the target timestamp
  const itemsUpToLastRelevant = allChronologicalItems.slice(
    0,
    lastRelevantIndex + 1,
  );

  // Calculate ratings state *after* the target match AND concurrent events
  const ratingsAfter = itemsUpToLastRelevant.reduce((currentRatings, item) => {
    if (item.type === "match") {
      return getRatingsAfterMatch(currentRatings, item.data, system);
    } else {
      return applyEventToRatings(currentRatings, item.data, system);
    }
  }, {} as PlayerRatingRecord);

  // Find players involved in the specific target match
  const playersInMatch = [
    targetMatch.whitePlayerOne.id,
    targetMatch.whitePlayerTwo?.id,
    targetMatch.blackPlayerOne.id,
    targetMatch.blackPlayerTwo?.id,
  ].filter(isDefined);

  return diffRatings(ratingsBefore, ratingsAfter, playersInMatch, system);
}

function getRatingsAfterMatch<TRating>(
  ratings: Record<string, PlayerWithRating<TRating>>,
  match: Match,
  system: RatingSystem<TRating>,
) {
  const matchWithRatings: MatchWithRatings<TRating> = {
    ...match,
    whitePlayerOne: ratings[match.whitePlayerOne.id] ?? {
      player: match.whitePlayerOne,
      rating: system.defaultRating,
    },
    whitePlayerTwo: match.whitePlayerTwo
      ? ratings[match.whitePlayerTwo.id] ?? {
          player: match.whitePlayerTwo,
          rating: system.defaultRating,
        }
      : null,
    blackPlayerOne: ratings[match.blackPlayerOne.id] ?? {
      player: match.blackPlayerOne,
      rating: system.defaultRating,
    },
    blackPlayerTwo: match.blackPlayerTwo
      ? ratings[match.blackPlayerTwo.id] ?? {
          player: match.blackPlayerTwo,
          rating: system.defaultRating,
        }
      : null,
  };

  const newRatings = system.rateMatch(matchWithRatings);
  const newRatingsMap = Object.fromEntries(
    newRatings.map((x) => [x.player.id, x]),
  );
  return {
    ...ratings,
    ...newRatingsMap,
  };
}

export function getPlayerRatingHistory<TRating>(
  matches: Match[],
  playerId: string,
  system: RatingSystem<TRating>,
): Record<string, TRating> {
  let ratings: Record<string, PlayerWithRating<TRating>> = {};

  const playersFirstMatch =
    matches.find((match) => hasPlayer(match, playerId))?.createdAt ??
    new Date();

  const dayBeforePlayersFirstMatch = subtractDays(playersFirstMatch, 1);

  const playerRatingHistory: Record<string, TRating> = {
    [getDatePartFromDate(dayBeforePlayersFirstMatch)]: system.defaultRating,
  };

  for (const match of matches) {
    ratings = getRatingsAfterMatch(ratings, match, system);
    if (hasPlayer(match, playerId)) {
      const dateOfMatch = getDatePartFromDate(match.createdAt);
      playerRatingHistory[dateOfMatch] = ratings[playerId].rating;
    }
  }

  return playerRatingHistory;
}

function hasPlayer(match: Match, playerId: string): boolean {
  return (
    match.whitePlayerOne.id === playerId ||
    match.whitePlayerTwo?.id === playerId ||
    match.blackPlayerOne.id === playerId ||
    match.blackPlayerTwo?.id === playerId
  );
}

function diffRatings<TRating>(
  before: Record<string, PlayerWithRating<TRating>>,
  after: Record<string, PlayerWithRating<TRating>>,
  players: string[],
  system: RatingSystem<TRating>,
): PlayerWithRatingDiff<TRating>[] {
  const diffs: PlayerWithRatingDiff<TRating>[] = [];

  for (const playerId of players) {
    const ratingBefore = before[playerId]?.rating;
    const ratingAfter = after[playerId]?.rating;

    const rankBefore = Object.values(before)
      .toSorted((a, b) => system.toNumber(b.rating) - system.toNumber(a.rating))
      .findIndex((x) => x.player.id === playerId);
    const rankAfter = Object.values(after)
      .toSorted((a, b) => system.toNumber(b.rating) - system.toNumber(a.rating))
      .findIndex((x) => x.player.id === playerId);

    diffs.push({
      player: after[playerId].player,
      ratingBefore: ratingBefore ?? system.defaultRating,
      ratingAfter,
      rankBefore: rankBefore === -1 ? undefined : rankBefore + 1,
      rankAfter: rankAfter + 1,
    });
  }

  return diffs;
}

export function openskill(
  options?: Options,
  eventSystemEnabled = true,
): RatingSystem<OpenskillRating> {
  const selectedOptions: Options = options ?? {
    mu: 1000, // skill level, higher is better
    sigma: 500, // certainty, lower is more certain
    tau: 0.3, // tau prevents model from getting too certain about a players skill level
    z: 2, // used in calculation of ordinal `my - z * sigma`
  };

  return {
    defaultRating: rating(selectedOptions),
    type: "openskill",
    eventSystemEnabled: eventSystemEnabled,

    rateMatch(
      match: MatchWithRatings<OpenskillRating>,
    ): PlayerWithRating<OpenskillRating>[] {
      const whiteTeam = [
        match.whitePlayerOne.rating,
        match.whitePlayerTwo?.rating,
      ].filter(isDefined);

      const blackTeam = [
        match.blackPlayerOne.rating,
        match.blackPlayerTwo?.rating,
      ].filter(isDefined);

      // Lower is better
      // It makes a difference if the ranking is zero or non-zero, not sure why 🤷
      const outcomeRanking = {
        White: [1, 2],
        Black: [2, 1],
        Draw: [1, 1],
      }[match.result];

      const [
        [whitePlayerOneNewRating, whitePlayerTwoNewRating],
        [blackPlayerOneNewRating, blackPlayerTwoNewRating],
      ] = rate([whiteTeam, blackTeam], {
        ...selectedOptions,
        rank: outcomeRanking,
      });

      const result: PlayerWithRating<OpenskillRating>[] = [
        {
          player: match.whitePlayerOne.player,
          rating: whitePlayerOneNewRating,
        },
        {
          player: match.blackPlayerOne.player,
          rating: blackPlayerOneNewRating,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          rating: whitePlayerTwoNewRating,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          rating: blackPlayerTwoNewRating,
        });
      }

      return result;
    },

    toNumber(rating: OpenskillRating) {
      return Math.floor(ordinal(rating, selectedOptions));
    },

    equals(a: OpenskillRating | undefined, b: OpenskillRating | undefined) {
      return a?.mu === b?.mu && a?.sigma === b?.sigma;
    },

    applyEventAdjustment(currentRating, eventType) {
      const isCompletion = eventType.endsWith("Completed");
      const adjustment = isCompletion ? 25 : -10;
      return rating({ ...currentRating, mu: currentRating.mu + adjustment });
    },
  };
}

export function elo(
  config?: EloConfig,
  eventSystemEnabled = true,
): RatingSystem<EloRating> {
  function avg(ratings: number[]) {
    const totalElo = ratings.reduce((sum, player) => sum + player, 0);
    return Math.round(totalElo / ratings.length);
  }

  function getExpectedScore(playerElo: number, opponentElo: number) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  function getKFactor(elo: number) {
    if (elo > 2500) return 16;
    if (elo > 2300) return 24;
    if (elo > 2100) return 32;
    if (elo > 1900) return 40;
    if (elo > 1700) return 48;
    if (elo > 1600) return 56;
    return 64;
  }

  function calculateNewElo(
    kFactor: number,
    currentElo: number,
    expectedScore: number,
    actualScore: number,
    eloFloor: number,
  ) {
    const newElo = Math.round(
      currentElo + kFactor * (actualScore - expectedScore),
    );
    return Math.max(newElo, eloFloor);
  }

  return {
    defaultRating: 1500,
    type: "elo",
    eventSystemEnabled: eventSystemEnabled,

    rateMatch(
      match: MatchWithRatings<EloRating>,
    ): PlayerWithRating<EloRating>[] {
      const whiteTeamElo = avg(
        [match.whitePlayerOne.rating, match.whitePlayerTwo?.rating].filter(
          isDefined,
        ),
      );

      const blackTeamElo = avg(
        [match.blackPlayerOne.rating, match.blackPlayerTwo?.rating].filter(
          isDefined,
        ),
      );

      const whiteTeamExpectedScore = getExpectedScore(
        whiteTeamElo,
        blackTeamElo,
      );

      const blackTeamExpectedScore = getExpectedScore(
        blackTeamElo,
        whiteTeamElo,
      );

      const [whiteTeamActualScore, blackTeamActualScore] = {
        White: [1, 0],
        Black: [0, 1],
        Draw: [0.5, 0.5],
      }[match.result];

      const whiteTeamKFactor = getKFactor(whiteTeamElo);
      const blackTeamKFactor = getKFactor(blackTeamElo);

      const whiteTeamEloAfter = calculateNewElo(
        whiteTeamKFactor,
        whiteTeamElo,
        whiteTeamExpectedScore,
        whiteTeamActualScore,
        config?.eloFloor ?? 0,
      );
      const blackTeamEloAfter = calculateNewElo(
        blackTeamKFactor,
        blackTeamElo,
        blackTeamExpectedScore,
        blackTeamActualScore,
        config?.eloFloor ?? 0,
      );

      const whiteTeamEloChange = whiteTeamEloAfter - whiteTeamElo;
      const blackTeamEloChange = blackTeamEloAfter - blackTeamElo;

      const result: PlayerWithRating<EloRating>[] = [
        {
          player: match.whitePlayerOne.player,
          rating: match.whitePlayerOne.rating + whiteTeamEloChange,
        },
        {
          player: match.blackPlayerOne.player,
          rating: match.blackPlayerOne.rating + blackTeamEloChange,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          rating: match.whitePlayerTwo.rating + whiteTeamEloChange,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          rating: match.blackPlayerTwo.rating + blackTeamEloChange,
        });
      }

      return result;
    },

    toNumber(score: EloRating) {
      return Math.floor(score);
    },

    equals(a: EloRating | undefined, b: EloRating | undefined) {
      return a === b;
    },

    applyEventAdjustment(currentRating, eventType) {
      const isCompletion = eventType.endsWith("Completed");
      const adjustment = isCompletion ? 50 : -20;
      const newRating = currentRating + adjustment;
      return Math.max(newRating, config?.eloFloor ?? -Infinity);
    },
  };
}

export function xp(
  config?: XPConfig,
  eventSystemEnabled = true,
): RatingSystem<XPRating> {
  /*
    A rating system inspired by the experience system from RPG games.

    This means you start with 0 XP and gain XP with each match.

    Your rating is not the XP, but rather the level that amount of XP
    corresponds to.
  */

  const selectedConfig: XPConfig = config ?? {
    // Found these values by experimenting on https://www.geogebra.org/calculator
    a: 3,
    b: 400,
  };

  function calculateLevel(xp: XPRating): number {
    /*
      Converts XP into a level using a logarithmic function

      Level 1: 0 XP
      Level 2: ~160 XP
      Level 3: ~380 XP
      Level 4: ~688 XP
      Level 5: ~1130 XP
      Level 6: ~1740 XP
      Level 7: ~2580 XP
      Level 8: ~3725 XP
      Level 9: ~5410 XP
      Level 10: ~7675 XP
    */

    const { a, b } = selectedConfig;
    return Math.floor(a * Math.log(1 + xp / b) + 1);
  }

  function calculateXPGain(opponentLevel: number): number {
    /*
      XP gain is loosely based on needing to win 4 matches against somebody of
      your own level in order to gain a level.
    */
    if (opponentLevel <= 1) return 45;
    else if (opponentLevel <= 2) return 65;
    else if (opponentLevel <= 3) return 77;
    else if (opponentLevel <= 4) return 110;
    else if (opponentLevel <= 5) return 150;
    else if (opponentLevel <= 6) return 210;
    else if (opponentLevel <= 7) return 285;
    else if (opponentLevel <= 8) return 410;
    else if (opponentLevel <= 9) return 565;
    else return 800;
  }

  return {
    defaultRating: 0,
    type: "xp",
    eventSystemEnabled: eventSystemEnabled,

    rateMatch(match: MatchWithRatings<XPRating>): PlayerWithRating<XPRating>[] {
      const whiteTeam = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        isDefined,
      );

      const blackTeam = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        isDefined,
      );

      if (match.result === "Draw") {
        // nobody gets any XP
        return [...whiteTeam, ...blackTeam];
      }

      const winningTeam = match.result === "White" ? whiteTeam : blackTeam;
      const loosingTeam = match.result === "White" ? blackTeam : whiteTeam;

      const xpGain =
        loosingTeam
          .map((user) => user.rating)
          .map(calculateLevel)
          .map(calculateXPGain)
          .reduce((acc, cur) => acc + cur, 0) / loosingTeam.length;

      const winningTeamAfter = winningTeam.map((user) => ({
        player: user.player,
        rating: user.rating + xpGain,
      }));

      return [...winningTeamAfter, ...loosingTeam];
    },

    toNumber(xp: XPRating) {
      return calculateLevel(xp);
    },

    equals(a: XPRating | undefined, b: XPRating | undefined) {
      return a === b;
    },

    applyEventAdjustment(currentRating, eventType) {
      const isCompletion = eventType.endsWith("Completed");
      const adjustment = isCompletion ? 100 : -40;
      return Math.max(0, currentRating + adjustment);
    },
  };
}

export function getRatingSystem(
  type: RatingSystemType,
  eventSystemType: Season["ratingEventSystem"],
): RatingSystem<Rating> {
  const eventSystemEnabled = eventSystemType !== "none";
  switch (type) {
    case "xp":
      return xp(undefined, eventSystemEnabled) as RatingSystem<Rating>;
    case "openskill":
      return openskill(undefined, eventSystemEnabled) as RatingSystem<Rating>;
    case "elo":
    default:
      return elo(undefined, eventSystemEnabled) as RatingSystem<Rating>;
  }
}

function applyEventToRatings<TRating>(
  currentRatings: Record<string, PlayerWithRating<TRating>>,
  event: SelectRatingEvent,
  system: RatingSystem<TRating>,
): Record<string, PlayerWithRating<TRating>> {
  if (!system.eventSystemEnabled) {
    return currentRatings;
  }

  const playerId = event.playerId;
  if (!playerId) return currentRatings;

  // Get current player data or initialize with default if not found
  const playerRatingData = currentRatings[playerId] ?? {
    // TODO: Fetch player name properly if player only exists due to an event
    player: { id: playerId, name: "Unknown (from event)" },
    rating: system.defaultRating,
  };

  let parsedEventData: QuestEvent<unknown> | null = null;
  try {
    // Explicitly cast the parsed result to QuestEvent<unknown>
    parsedEventData = JSON.parse(event.data as string) as QuestEvent<unknown>;
  } catch (error) {
    console.error("Failed to parse rating event data:", error, event.data);
    return currentRatings; // Skip event if data is invalid
  }

  if (!parsedEventData) return currentRatings;

  // Use the system-specific adjustment method
  const newRating = system.applyEventAdjustment(
    playerRatingData.rating,
    parsedEventData.type,
  );

  return {
    ...currentRatings,
    [playerId]: {
      ...playerRatingData,
      rating: newRating, // newRating is now guaranteed to be TRating
    },
  };
}
