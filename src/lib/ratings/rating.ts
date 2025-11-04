import { type RatingSystemType } from "../../db/schema/season";
import { getDatePartFromDate, subtractDays } from "../dateUtils";
import { isDefined } from "../utils";
import { elo, type EloRating } from "./eloRatingSystem";
import { gameCount, type GameCountRating } from "./gameCountRatingSystem";
import { openskill, type OpenskillRating } from "./openskillRatingSystem";
import { scoreDiff, type ScoreDiffRating } from "./scoreDiffRatingSystem";
import {
  streakMultiplier,
  type StreakMultiplierRating,
} from "./streakMultiplierRatingSystem";
import { underdog, type UnderdogRating } from "./underdogRatingSystem";
import { xp, type XPRating } from "./xpRatingSystem";

/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */
export type Rating =
  | EloRating
  | XPRating
  | ScoreDiffRating
  | OpenskillRating
  | StreakMultiplierRating
  | UnderdogRating
  | GameCountRating;
/* eslint-enable @typescript-eslint/no-duplicate-type-constituents */

export interface RatingSystem<TRating> {
  type: RatingSystemType;
  defaultRating: TRating;
  rateMatch: (match: MatchWithRatings<TRating>) => PlayerWithRating<TRating>[];
  toNumber: (rating: TRating) => number;
  equals: (a: TRating | undefined, b: TRating | undefined) => boolean;
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

export interface MatchWithRatings<TRating> {
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

  return Object.values(ratings).toSorted(
    (a, b) => system.toNumber(b.rating) - system.toNumber(a.rating),
  );
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

  const playersInMatch = [
    matchToDiff.whitePlayerOne.id,
    matchToDiff.whitePlayerTwo?.id,
    matchToDiff.blackPlayerOne.id,
    matchToDiff.blackPlayerTwo?.id,
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
      rankBefore: rankBefore === -1 ? undefined : rankBefore,
      rankAfter: rankAfter,
    });
  }

  return diffs;
}

export function getRatingSystem(type: RatingSystemType): RatingSystem<Rating> {
  switch (type) {
    case "scoreDiff":
      return scoreDiff() as RatingSystem<Rating>;
    case "xp":
      return xp() as RatingSystem<Rating>;
    case "openskill":
      return openskill() as RatingSystem<Rating>;
    case "streakMultiplier":
      return streakMultiplier() as RatingSystem<Rating>;
    case "underdog":
      return underdog() as RatingSystem<Rating>;
    case "gameCount":
      return gameCount() as RatingSystem<Rating>;
    case "elo":
    default:
      return elo() as RatingSystem<Rating>;
  }
}

export function prettyRatingSystemType(ratingSystem: RatingSystemType): string {
  switch (ratingSystem) {
    case "openskill":
      return "OpenSkill";
    case "elo":
      return "ELO";
    case "xp":
      return "XP";
    case "scoreDiff":
      return "Score Difference";
    case "streakMultiplier":
      return "Streak Multiplier";
    case "underdog":
      return "Underdog";
    case "gameCount":
      return "Game Count";
    default:
      return ratingSystem;
  }
}

/**
 * Calculate rating and rank changes between two time periods.
 *
 * @param matches - All matches in the season.
 * @param cutoffDate - The date to compare against (e.g., 1 day ago, 1 week ago).
 * @param system - The rating system to use.
 * @returns Players with rating/rank changes.
 * 
 * OLD IMPLEMENTATION BELOW FOR REFERENCE


export function getTimeIntervalRatingDiff<TRating>(
  matches: Match[],
  cutoffDate: Date,
  system: RatingSystem<TRating>,
): PlayerWithRatingDiff<TRating>[] {


  const orderedMatches = matches.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const matchesBeforeCutoff = orderedMatches.filter(
    (m) => m.createdAt.getTime() < cutoffDate.getTime(),
  );

  type PlayerRatingRecord = Record<string, PlayerWithRating<TRating>>;

  const ratingsBefore = matchesBeforeCutoff.reduce(
    (ratings, match) => getRatingsAfterMatch(ratings, match, system),
    {} as PlayerRatingRecord,
  );

  const ratingsAfter = orderedMatches.reduce(
    (ratings, match) => getRatingsAfterMatch(ratings, match, system),
    {} as PlayerRatingRecord,
  );

  const allPlayerIds = Object.keys(ratingsAfter);

  return diffRatings(ratingsBefore, ratingsAfter, allPlayerIds, system);
} */

/* NEW IMPLEMENTATION BELOW - MORE EFFICIENT */
export function getTimeIntervalRatingDiff<TRating>(
  matches: Match[],
  cutoffDate: Date,
  system: RatingSystem<TRating>,
): PlayerWithRatingDiff<TRating>[] {
  
  // Sort FIRST
  const sortedMatches = matches.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  
  // Find index on SORTED array
  const cutoffIndex = sortedMatches.findIndex(
    (m) => m.createdAt.getTime() > cutoffDate.getTime(),
  );
  
  // Handle edge case: all matches before cutoff
  const actualCutoffIndex = cutoffIndex === -1 ? sortedMatches.length : cutoffIndex;
  
  const matchesBeforeCutoff = sortedMatches.slice(0, actualCutoffIndex);
  const matchesAfterCutoff = sortedMatches.slice(actualCutoffIndex);
  
  const ratingsBefore = matchesBeforeCutoff.reduce(
    (ratings, match) => getRatingsAfterMatch(ratings, match, system),
    {} as Record<string, PlayerWithRating<TRating>>,
  );
  
  // Continue from ratingsBefore (efficient!)
  const ratingsAfter = matchesAfterCutoff.reduce(
    (ratings, match) => getRatingsAfterMatch(ratings, match, system),
    ratingsBefore,
  );
  
  const allPlayerIds = Object.keys(ratingsAfter);
  return diffRatings(ratingsBefore, ratingsAfter, allPlayerIds, system);
}


export type TimeInterval = "today" | "daily" | "weekly" | "monthly";

export function getTimeIntervalCutoffDate(interval: TimeInterval): Date {
  const cutoff = new Date();

  switch (interval) {
    case "today":
      cutoff.setHours(0, 0, 0, 0);
      break;
    case "daily":
      cutoff.setDate(cutoff.getDate() - 1);
      break;
    case "weekly":
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case "monthly":
      cutoff.setMonth(cutoff.getDate() - 29);
      break;
  }

  return cutoff;
}
