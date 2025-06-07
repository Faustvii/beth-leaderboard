import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type ScoreDiffRating = number;

export function scoreDiff(): RatingSystem<ScoreDiffRating> {
  /*
    A rating system where a match's score difference is awarded to the winning
    team and subtracted from the losing team. You basically steal the points
    from the losing team and give them to the winning team.

    This makes it a zero-sum game, where the total amount of points is constant.
  */

  return {
    type: "scoreDiff",
    defaultRating: 0,

    rateMatch(
      match: MatchWithRatings<ScoreDiffRating>,
    ): PlayerWithRating<ScoreDiffRating>[] {
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
        rating: user.rating + match.scoreDiff,
      }));

      const loosingTeamAfter = loosingTeam.map((user) => ({
        player: user.player,
        rating: user.rating - match.scoreDiff,
      }));

      return [...winningTeamAfter, ...loosingTeamAfter];
    },

    toNumber(rating: ScoreDiffRating) {
      return rating;
    },

    equals(a: ScoreDiffRating | undefined, b: ScoreDiffRating | undefined) {
      return a === b;
    },
  };
}
