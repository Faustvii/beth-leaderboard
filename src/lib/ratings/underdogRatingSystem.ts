import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type UnderdogRating = number;

export interface UnderdogConfig {
  basePoints: number;
  ratingDiffMultiplier: number;
  maxRatingDiff: number;
  upsetBonus: number;
  minUpsetDiff: number;
  teamContributionFactor: number;
}

export function underdog(
  config?: UnderdogConfig,
): RatingSystem<UnderdogRating> {
  /*
    A rating system that rewards players for beating higher-rated opponents and penalizes them
    for losing to lower-rated opponents. The system includes:
    - Base points for winning/losing
    - Additional points based on rating difference
    - Upset bonus for beating significantly higher-rated opponents
    - Team contribution factor that adjusts points based on teammate rating differences
      (reduces points for weaker players when playing with stronger teammates to prevent
      rating inflation from being carried, while protecting them from harsh penalties)

    This creates a dynamic system where:
    - Underdogs get more points for upsets
    - Favorites risk more points when losing
    - Team composition affects point distribution
    - Players are incentivized to play against stronger opponents rather than farming weaker ones
  */

  const selectedConfig: UnderdogConfig = config ?? {
    basePoints: 25, // Base points awarded for a win
    ratingDiffMultiplier: 0.125, // Points multiplier per rating difference (e.g. 200 rating diff = +25 points, 400 diff = +50 points)
    maxRatingDiff: 1000, // Maximum rating difference to consider
    upsetBonus: 50, // Extra points for beating a much higher rated opponent
    minUpsetDiff: 100, // Minimum rating difference required for upset bonus
    teamContributionFactor: 0.3, // Rating difference between teammates affects point distribution - 500 diff is 15% multiplier
  };

  function processTeam(
    team: PlayerWithRating<UnderdogRating>[],
    opponents: PlayerWithRating<UnderdogRating>[],
    isWinner: boolean,
  ) {
    return team.map((player) => {
      const averagePoints = calculatePointsAgainstTeam(
        player,
        opponents,
        isWinner,
      );

      // Apply team contribution as a multiplier
      const teammate = team.find((p) => p.player.id !== player.player.id);
      if (teammate) {
        const teamMultiplier = calculateTeamContribution(
          player.rating,
          teammate.rating,
        );
        return {
          player: player.player,
          rating:
            player.rating +
            averagePoints * teamMultiplier * (isWinner ? 1 : -1),
        };
      }

      return {
        player: player.player,
        rating: player.rating + averagePoints * (isWinner ? 1 : -1),
      };
    });
  }

  function calculatePointsAgainstTeam(
    player: PlayerWithRating<UnderdogRating>,
    opponents: PlayerWithRating<UnderdogRating>[],
    isWinner: boolean,
  ) {
    const pointsAgainstOpponents = opponents.map((opponent) => {
      const isUpset = isWinner
        ? player.rating < opponent.rating
        : opponent.rating < player.rating;
      return calculatePoints(player.rating, opponent.rating, isUpset);
    });

    const totalPoints = pointsAgainstOpponents.reduce(
      (sum, points) => sum + points,
      0,
    );
    return totalPoints / pointsAgainstOpponents.length;
  }

  function calculatePoints(
    winnerRating: number,
    loserRating: number,
    isUpset: boolean,
  ): number {
    const ratingDiff = Math.min(
      Math.abs(winnerRating - loserRating),
      selectedConfig.maxRatingDiff,
    );

    const basePoints = selectedConfig.basePoints;
    const diffPoints = ratingDiff * selectedConfig.ratingDiffMultiplier;
    // Only give upset bonus if the rating difference is significant
    const upsetPoints =
      isUpset && ratingDiff >= selectedConfig.minUpsetDiff
        ? selectedConfig.upsetBonus
        : 0;

    return basePoints + diffPoints + upsetPoints;
  }

  function calculateTeamContribution(
    playerRating: number,
    teammateRating: number,
  ): number {
    const ratingDiff = playerRating - teammateRating;
    return 1 + (ratingDiff * selectedConfig.teamContributionFactor) / 1000;
  }

  return {
    type: "underdog",
    defaultRating: 1000, // Start at 1000 to have a neutral middle ground

    rateMatch(
      match: MatchWithRatings<UnderdogRating>,
    ): PlayerWithRating<UnderdogRating>[] {
      const whiteTeam = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        isDefined,
      );
      const blackTeam = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        isDefined,
      );

      if (match.result === "Draw") {
        // On a draw, no points are awarded or deducted
        return [...whiteTeam, ...blackTeam];
      }

      const winningTeam = match.result === "White" ? whiteTeam : blackTeam;
      const losingTeam = match.result === "White" ? blackTeam : whiteTeam;

      const winningTeamAfter = processTeam(winningTeam, losingTeam, true);
      const losingTeamAfter = processTeam(losingTeam, winningTeam, false);

      return [...winningTeamAfter, ...losingTeamAfter];
    },

    toNumber(rating: UnderdogRating) {
      return Math.round(rating);
    },

    equals(a: UnderdogRating | undefined, b: UnderdogRating | undefined) {
      return a === b;
    },
  };
}
