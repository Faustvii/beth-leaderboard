import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type XPRating = number;

export interface XPConfig {
  a: number;
  b: number;
}

export function xp(config?: XPConfig): RatingSystem<XPRating> {
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
    type: "xp",
    defaultRating: 0,

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
  };
}
