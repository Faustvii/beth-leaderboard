import { unique } from "..";
import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type UniqueOpponentsBeatenRating = string[];

export function uniqueOpponentsBeaten(): RatingSystem<UniqueOpponentsBeatenRating> {
  return {
    type: "uniqueOpponentsBeaten",
    defaultRating: [],

    rateMatch(
      match: MatchWithRatings<UniqueOpponentsBeatenRating>,
    ): PlayerWithRating<UniqueOpponentsBeatenRating>[] {
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

      const loosingTeamIds = loosingTeam.map((x) => x.player.id);

      const winningTeamAfter = winningTeam.map((user) => {
        return {
          player: user.player,
          rating: [...user.rating, ...loosingTeamIds].filter(unique),
        };
      });

      return [...winningTeamAfter, ...loosingTeam];
    },

    toNumber(rating: UniqueOpponentsBeatenRating) {
      return rating.length;
    },

    equals(
      a: UniqueOpponentsBeatenRating | undefined,
      b: UniqueOpponentsBeatenRating | undefined,
    ) {
      return a?.length === b?.length;
    },
  };
}
