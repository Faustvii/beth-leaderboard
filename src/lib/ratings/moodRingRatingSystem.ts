import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type MoodRingRating = number;

export interface MoodRingConfig {
  winHeat: number;
  blowoutThreshold: number;
  blowoutBonus: number;
  decayRate: number;
  lossDecayRate: number;
  minHeat: number;
}

export function moodRing(
  config?: MoodRingConfig,
): RatingSystem<MoodRingRating> {
  /*
    A momentum-based rating system inspired by mood rings.

    Each player carries "heat" that rises with wins and falls with losses.

    Wins by more than 100 points add a small blowout bonus; otherwise
    score difference does not matter.
  */

  const selectedConfig: MoodRingConfig = config ?? {
    winHeat: 10,
    blowoutThreshold: 100,
    blowoutBonus: 5,
    decayRate: 0.1,
    lossDecayRate: 0.3,
    minHeat: 0,
  };

  function applyHeatChange(
    currentHeat: MoodRingRating,
    outcome: "win" | "loss" | "draw",
    scoreDiff: number,
  ): MoodRingRating {
    const {
      winHeat,
      blowoutThreshold,
      blowoutBonus,
      decayRate,
      lossDecayRate,
      minHeat,
    } = selectedConfig;

    let heat = currentHeat;

    const percentLoss = outcome === "loss" ? lossDecayRate : decayRate;
    heat *= 1 - percentLoss;

    if (outcome === "win") {
      heat += winHeat;
      if (scoreDiff > blowoutThreshold) {
        heat += blowoutBonus;
      }
    }

    return Math.max(minHeat, Math.round(heat));
  }

  function ratePlayer(
    player: PlayerWithRating<MoodRingRating>,
    outcome: "win" | "loss" | "draw",
    scoreDiff: number,
  ): PlayerWithRating<MoodRingRating> {
    return {
      player: player.player,
      rating: applyHeatChange(player.rating, outcome, scoreDiff),
    };
  }

  return {
    type: "moodRing",
    defaultRating: 0,

    rateMatch(
      match: MatchWithRatings<MoodRingRating>,
    ): PlayerWithRating<MoodRingRating>[] {
      const whiteTeam = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        isDefined,
      );
      const blackTeam = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        isDefined,
      );

      if (match.result === "Draw") {
        return [...whiteTeam, ...blackTeam].map((player) =>
          ratePlayer(player, "draw", match.scoreDiff),
        );
      }

      const winningTeam = match.result === "White" ? whiteTeam : blackTeam;
      const losingTeam = match.result === "White" ? blackTeam : whiteTeam;

      return [
        ...winningTeam.map((player) =>
          ratePlayer(player, "win", match.scoreDiff),
        ),
        ...losingTeam.map((player) =>
          ratePlayer(player, "loss", match.scoreDiff),
        ),
      ];
    },

    toNumber(rating: MoodRingRating) {
      return rating;
    },

    toString(heat: MoodRingRating) {
      if (heat >= 80) return "Cooking";
      if (heat >= 50) return "On Fire";
      if (heat >= 20) return "Mid";
      return "Cold";
    },

    equals(a: MoodRingRating | undefined, b: MoodRingRating | undefined) {
      return a === b;
    },
  };
}
