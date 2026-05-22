import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type GameCountRating = number;

export function gameCount(): RatingSystem<GameCountRating> {
  return {
    type: "gameCount",
    defaultRating: 0,

    rateMatch(
      match: MatchWithRatings<GameCountRating>,
    ): PlayerWithRating<GameCountRating>[] {
      const players = [
        match.whitePlayerOne,
        match.whitePlayerTwo,
        match.blackPlayerOne,
        match.blackPlayerTwo,
      ].filter(isDefined);
      return players.map((user) => ({
        player: user.player,
        rating: user.rating + 1,
      }));
    },

    toNumber(rating: GameCountRating) {
      return rating;
    },

    toString(rating: GameCountRating) {
      return this.toNumber(rating).toString();
    },

    equals(a: GameCountRating | undefined, b: GameCountRating | undefined) {
      return a === b;
    },
  };
}
