import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export interface StreakMultiplierRating {
  points: number;
  currentWinStreak: number;
  currentLoseStreak: number;
}

export interface StreakMultiplierConfig {
  basePoints: number;
  streakMultiplier: number;
  maxStreakMultiplier: number;
  streakBonus: number;
}

export function streakMultiplier(
  config?: StreakMultiplierConfig,
): RatingSystem<StreakMultiplierRating> {
  const selectedConfig: StreakMultiplierConfig = config ?? {
    basePoints: 25, // Base points awarded for a win
    streakMultiplier: 1.2, // Multiplier increases by this factor per win
    maxStreakMultiplier: 15, // Maximum multiplier cap (roughly 15 win streak)
    streakBonus: 10, // Here to reward players early in their streaks, the multiplier overshadow this on longer streaks
  };

  function calculateWinPoints(streak: number): number {
    return calculatePoints(streak);
  }

  function calculateLosePoints(loseStreak: number): number {
    return -calculateWinPoints(loseStreak);
  }

  function calculatePoints(streak: number): number {
    const { streakMultiplier, maxStreakMultiplier, streakBonus, basePoints } =
      selectedConfig;
    const multiplier = Math.min(
      maxStreakMultiplier,
      Math.pow(streakMultiplier, streak > 1 ? streak : 0),
    );
    return Math.round(basePoints * multiplier + (streak > 1 ? streakBonus : 0));
  }

  return {
    type: "streakMultiplier",
    defaultRating: {
      points: 0,
      currentWinStreak: 0,
      currentLoseStreak: 0,
    },

    rateMatch(
      match: MatchWithRatings<StreakMultiplierRating>,
    ): PlayerWithRating<StreakMultiplierRating>[] {
      const whiteTeam = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        isDefined,
      );
      const blackTeam = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        isDefined,
      );

      if (match.result === "Draw") {
        // On a draw, streaks are maintained but no points are awarded
        return [...whiteTeam, ...blackTeam];
      }

      const winningTeam = match.result === "White" ? whiteTeam : blackTeam;
      const losingTeam = match.result === "White" ? blackTeam : whiteTeam;

      const winningTeamAfter = winningTeam.map((user) => {
        const currentWinStreak = user.rating.currentWinStreak + 1;
        const points =
          user.rating.points + calculateWinPoints(currentWinStreak);
        return {
          player: user.player,
          rating: {
            points,
            currentWinStreak,
            currentLoseStreak: 0, // Reset lose streak on win
          },
        };
      });

      const losingTeamAfter = losingTeam.map((user) => {
        const currentLoseStreak = user.rating.currentLoseStreak + 1;
        const points =
          user.rating.points + calculateLosePoints(currentLoseStreak);
        return {
          player: user.player,
          rating: {
            points,
            currentWinStreak: 0, // Reset win streak on loss
            currentLoseStreak,
          },
        };
      });

      return [...winningTeamAfter, ...losingTeamAfter];
    },

    toNumber(rating: StreakMultiplierRating) {
      return rating.points;
    },

    equals(
      a: StreakMultiplierRating | undefined,
      b: StreakMultiplierRating | undefined,
    ) {
      return a?.points === b?.points;
    },
  };
}
