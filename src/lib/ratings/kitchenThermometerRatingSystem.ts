import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type KitchenThermometerRating = number;

export interface KitchenThermometerConfig {
  winHeat: number;
  blowoutThreshold: number;
  blowoutBonus: number;
  decayRate: number;
  lossDecayRate: number;
  minHeat: number;
}

export function kitchenThermometer(
  config?: KitchenThermometerConfig,
): RatingSystem<KitchenThermometerRating> {
  /*
    A momentum-based rating system inspired by a kitchen thermometer.

    Each player carries "heat" that rises with wins and falls with losses.

    Wins by more than 100 points add a small blowout bonus; otherwise
    score difference does not matter.
  */

  const selectedConfig: KitchenThermometerConfig = config ?? {
    winHeat: 15,
    blowoutThreshold: 100,
    blowoutBonus: 10,
    decayRate: 0.1,
    lossDecayRate: 0.3,
    minHeat: 0,
  };

  function applyHeatChange(
    currentHeat: KitchenThermometerRating,
    outcome: "win" | "loss" | "draw",
    scoreDiff: number,
  ): KitchenThermometerRating {
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
    player: PlayerWithRating<KitchenThermometerRating>,
    outcome: "win" | "loss" | "draw",
    scoreDiff: number,
  ): PlayerWithRating<KitchenThermometerRating> {
    return {
      player: player.player,
      rating: applyHeatChange(player.rating, outcome, scoreDiff),
    };
  }

  return {
    type: "kitchenThermometer",
    defaultRating: 0,

    rateMatch(
      match: MatchWithRatings<KitchenThermometerRating>,
    ): PlayerWithRating<KitchenThermometerRating>[] {
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

    toNumber(rating: KitchenThermometerRating) {
      return rating;
    },

    toString(heat: KitchenThermometerRating) {
      if (heat >= 220) return "Roasted";
      if (heat >= 180) return "Flash Fried";
      if (heat >= 140) return "Broiling";
      if (heat >= 100) return "Boiling Point";
      if (heat >= 75) return "Sizzling";
      if (heat >= 50) return "Simmering";
      if (heat >= 30) return "Lukewarm";
      if (heat >= 15) return "Room Temp";
      if (heat >= 5) return "Chilled";
      return "Deep Freeze";
    },

    equals(
      a: KitchenThermometerRating | undefined,
      b: KitchenThermometerRating | undefined,
    ) {
      return a === b;
    },
  };
}
