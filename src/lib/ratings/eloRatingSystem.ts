import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type EloRating = number;

export interface EloConfig {
  eloFloor: number;
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
  };
}
