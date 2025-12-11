import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export interface ScoreAvgRating {
  diff: number;
  count: number;
}

export function scoreAvg(): RatingSystem<ScoreAvgRating> {
  /*
    Same as @see scoreDiff, but averages it over the count of games played.
  */

  return {
    type: "scoreAvg",
    defaultRating: { diff: 0, count: 0 },

    rateMatch(
      match: MatchWithRatings<ScoreAvgRating>,
    ): PlayerWithRating<ScoreAvgRating>[] {
      const whiteTeam = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        isDefined,
      );

      const blackTeam = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        isDefined,
      );

      if (match.result === "Draw") {
        // nobody gets any points
        return [...whiteTeam, ...blackTeam];
      }

      const winningTeam = match.result === "White" ? whiteTeam : blackTeam;
      const loosingTeam = match.result === "White" ? blackTeam : whiteTeam;

      const winningTeamAfter = winningTeam.map((user) => ({
        player: user.player,
        rating: {
          diff: user.rating.diff + match.scoreDiff,
          count: user.rating.count + 1,
        },
      }));

      const loosingTeamAfter = loosingTeam.map((user) => ({
        player: user.player,
        rating: {
          diff: user.rating.diff - match.scoreDiff,
          count: user.rating.count + 1,
        },
      }));

      return [...winningTeamAfter, ...loosingTeamAfter];
    },

    toNumber(rating: ScoreAvgRating) {
      return rating.count === 0 ? 0 : Math.floor(rating.diff / rating.count);
    },

    equals(a: ScoreAvgRating | undefined, b: ScoreAvgRating | undefined) {
      if (a === undefined && b === undefined) return true;
      if (a === undefined || b === undefined) return false;
      return this.toNumber(a) === this.toNumber(b);
    },
  };
}
