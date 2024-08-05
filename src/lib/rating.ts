import { ordinal, rate, rating } from "openskill";
import {
  type Rating as OpenskillRating,
  type Options,
} from "openskill/dist/types";
import { type RatingSystemType } from "../db/schema/season";
import { type EloConfig } from "../types/elo";
import { daysBetween, getDatePartFromDate, subtractDays } from "./dateUtils";
import { lerp, normalize } from "./mathUtils";
import { isDefined } from "./utils";

type EloRating = number;
export type Rating = EloRating | OpenskillRating;

export interface RatingSystem<TRating> {
  defaultRating: TRating;
  decayRating: (rating: TRating, now: Date, latestMatchAt: Date) => TRating;
  rateMatch: (match: MatchWithRatings<TRating>) => PlayerWithRating<TRating>[];
  toNumber: (rating: TRating) => number;
  equals: (a: TRating | undefined, b: TRating | undefined) => boolean;
}

export interface PlayerWithRating<TRating> {
  player: Player;
  rating: TRating;
  latestMatchAt: Date;
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

export function getRatings<TRating>(
  matches: Match[],
  system: RatingSystem<TRating>,
): PlayerWithRating<TRating>[] {
  const orderedMatches = matches.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const ratings = orderedMatches.reduce(
    (ratings, match) => getRatingsAfterMatch(ratings, match, system),
    {} as Record<string, PlayerWithRating<TRating>>,
  );

  return Object.values(ratings)
    .map((player) => ({
      ...player,
      rating: system.decayRating(
        player.rating,
        new Date(),
        player.latestMatchAt,
      ),
    }))
    .toSorted((a, b) => system.toNumber(b.rating) - system.toNumber(a.rating));
}

export function getMatchRatingDiff<TRating>(
  matches: Match[],
  system: RatingSystem<TRating>,
): PlayerWithRatingDiff<TRating>[] {
  const orderedMatches = matches.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const matchToDiff = orderedMatches.splice(-1, 1)[0];

  type PlayerRatingRecord = Record<string, PlayerWithRating<TRating>>;

  const ratingsBefore = orderedMatches.reduce(
    (ratings, match) => getRatingsAfterMatch(ratings, match, system),
    {} as PlayerRatingRecord,
  );

  const ratingsAfter = getRatingsAfterMatch(ratingsBefore, matchToDiff, system);

  return diffRatings(ratingsBefore, ratingsAfter, system);
}

function decayPlayersInMatch<TRating>(
  ratings: Record<string, PlayerWithRating<TRating>>,
  now: Date,
  playerIds: string[],
  system: RatingSystem<TRating>,
): Record<string, PlayerWithRating<TRating>> {
  const decayedPlayerRatings = Object.fromEntries(
    playerIds
      .filter((playerId) => !!ratings[playerId])
      .map((playerId) => [
        playerId,
        {
          ...ratings[playerId],
          rating: system.decayRating(
            ratings[playerId].rating,
            now,
            ratings[playerId].latestMatchAt,
          ),
        },
      ]),
  );

  return {
    ...ratings,
    ...decayedPlayerRatings,
  };
}

function getRatingsAfterMatch<TRating>(
  ratings: Record<string, PlayerWithRating<TRating>>,
  match: Match,
  system: RatingSystem<TRating>,
): Record<string, PlayerWithRating<TRating>> {
  const playersInMatch = [
    match.whitePlayerOne.id,
    match.whitePlayerTwo?.id,
    match.blackPlayerOne.id,
    match.blackPlayerTwo?.id,
  ].filter(isDefined);

  const decayedRatings = decayPlayersInMatch(
    ratings,
    match.createdAt,
    playersInMatch,
    system,
  );

  const matchWithRatings: MatchWithRatings<TRating> = {
    ...match,
    whitePlayerOne: decayedRatings[match.whitePlayerOne.id] ?? {
      player: match.whitePlayerOne,
      rating: system.defaultRating,
      latestMatchAt: match.createdAt,
    },
    whitePlayerTwo: match.whitePlayerTwo
      ? decayedRatings[match.whitePlayerTwo.id] ?? {
          player: match.whitePlayerTwo,
          rating: system.defaultRating,
          latestMatchAt: match.createdAt,
        }
      : null,
    blackPlayerOne: decayedRatings[match.blackPlayerOne.id] ?? {
      player: match.blackPlayerOne,
      rating: system.defaultRating,
      latestMatchAt: match.createdAt,
    },
    blackPlayerTwo: match.blackPlayerTwo
      ? decayedRatings[match.blackPlayerTwo.id] ?? {
          player: match.blackPlayerTwo,
          rating: system.defaultRating,
          latestMatchAt: match.createdAt,
        }
      : null,
  };

  const newRatings = system.rateMatch(matchWithRatings);
  const newRatingsMap = Object.fromEntries(
    newRatings.map((x) => [x.player.id, x]),
  );
  return {
    ...decayedRatings,
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

  // decay player from last match to request time
  ratings = decayPlayersInMatch(ratings, new Date(), [playerId], system);
  playerRatingHistory[getDatePartFromDate(new Date())] =
    ratings[playerId].rating;

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
  system: RatingSystem<TRating>,
): PlayerWithRatingDiff<TRating>[] {
  const distinctPlayers = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ];

  const diffs: PlayerWithRatingDiff<TRating>[] = [];

  for (const playerId of distinctPlayers) {
    const ratingBefore = before[playerId]?.rating;
    const ratingAfter = after[playerId]?.rating;

    const rankBefore = Object.values(before)
      .toSorted((a, b) => system.toNumber(b.rating) - system.toNumber(a.rating))
      .findIndex((x) => x.player.id === playerId);
    const rankAfter = Object.values(after)
      .toSorted((a, b) => system.toNumber(b.rating) - system.toNumber(a.rating))
      .findIndex((x) => x.player.id === playerId);

    if (!system.equals(ratingBefore, ratingAfter)) {
      diffs.push({
        player: after[playerId].player,
        ratingBefore: ratingBefore ?? system.defaultRating,
        ratingAfter,
        rankBefore: rankBefore === -1 ? undefined : rankBefore + 1,
        rankAfter: rankAfter + 1,
      });
    }
  }

  return diffs;
}

export function openskill(options?: Options): RatingSystem<OpenskillRating> {
  const selectedOptions: Options = options ?? {
    mu: 1000, // skill level, higher is better
    sigma: 500, // certainty, lower is more certain
    tau: 0.3, // tau prevents model from getting too certain about a players skill level
    z: 2, // used in calculation of ordinal `my - z * sigma`
  };

  const defaultRating = rating(selectedOptions);

  const toNumber = (rating: OpenskillRating) => {
    return Math.floor(ordinal(rating, selectedOptions));
  };

  return {
    defaultRating,

    decayRating(
      rating: OpenskillRating,
      now: Date,
      latestMatchAt: Date,
    ): OpenskillRating {
      const daysSinceLastMatch = daysBetween(latestMatchAt, now);
      const daysToReachMaxDecay = 63; // 9 weeks (after initial 3 weeks)
      const decayDays = Math.min(daysSinceLastMatch - 21, daysToReachMaxDecay);

      if (decayDays <= 0) {
        return rating;
      }

      const maxMuScale = 0.5;
      const maxSigmaScale = 0.25;

      const amountOfDecay = normalize(decayDays, 0, daysToReachMaxDecay);

      const decayedMu = lerp(
        amountOfDecay * maxMuScale,
        defaultRating.mu,
        rating.mu,
      );

      const decayedSigma = lerp(
        amountOfDecay * maxSigmaScale,
        rating.sigma,
        defaultRating.sigma,
      );

      return {
        mu: Math.min(decayedMu, rating.mu),
        sigma: Math.max(decayedSigma, rating.sigma),
      };
    },

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
          latestMatchAt: match.createdAt,
        },
        {
          player: match.blackPlayerOne.player,
          rating: blackPlayerOneNewRating,
          latestMatchAt: match.createdAt,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          rating: whitePlayerTwoNewRating,
          latestMatchAt: match.createdAt,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          rating: blackPlayerTwoNewRating,
          latestMatchAt: match.createdAt,
        });
      }

      return result;
    },

    toNumber,

    equals(a: OpenskillRating | undefined, b: OpenskillRating | undefined) {
      if (a === undefined && b === undefined) return true;
      if (a === undefined || b === undefined) return false;
      return a.sigma === b.sigma && a.mu === b.mu;
    },
  };
}

export function elo(config?: EloConfig): RatingSystem<EloRating> {
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

    decayRating(rating: number, _now: Date, _latestMatchAt: Date): number {
      // no decay
      return rating;
    },

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
          latestMatchAt: match.createdAt,
        },
        {
          player: match.blackPlayerOne.player,
          rating: match.blackPlayerOne.rating + blackTeamEloChange,
          latestMatchAt: match.createdAt,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          rating: match.whitePlayerTwo.rating + whiteTeamEloChange,
          latestMatchAt: match.createdAt,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          rating: match.blackPlayerTwo.rating + blackTeamEloChange,
          latestMatchAt: match.createdAt,
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
  };
}

export function getRatingSystem(type: RatingSystemType): RatingSystem<Rating> {
  switch (type) {
    case "openskill":
      return openskill() as RatingSystem<Rating>;
    case "elo":
    default:
      return elo() as RatingSystem<Rating>;
  }
}
