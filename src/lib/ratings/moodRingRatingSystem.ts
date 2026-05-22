import { isDefined } from "../utils";
import {
  type MatchWithRatings,
  type PlayerWithRating,
  type RatingSystem,
} from "./rating";

export type MoodRingRating = number;

export type Mood = "cold" | "mid" | "onFire" | "cooking";

export interface MoodRingConfig {
  winHeat: number;
  lossHeat: number;
  blowoutThreshold: number;
  blowoutBonus: number;
  decayRate: number;
  minHeat: number;
}

export function getMoodFromHeat(heat: MoodRingRating): Mood {
  if (heat >= 80) return "cooking";
  if (heat >= 50) return "onFire";
  if (heat >= 20) return "mid";
  return "cold";
}

export function prettyMood(mood: Mood): string {
  switch (mood) {
    case "cold":
      return "Cold";
    case "mid":
      return "Mid";
    case "onFire":
      return "On Fire";
    case "cooking":
      return "Cooking";
  }
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
    lossHeat: 8,
    blowoutThreshold: 100,
    blowoutBonus: 5,
    decayRate: 0.9,
    minHeat: 0,
  };

  function applyHeatChange(
    currentHeat: MoodRingRating,
    outcome: "win" | "loss" | "draw",
    scoreDiff: number,
  ): MoodRingRating {
    const {
      winHeat,
      lossHeat,
      blowoutThreshold,
      blowoutBonus,
      decayRate,
      minHeat,
    } = selectedConfig;

    let heat = currentHeat * decayRate;

    if (outcome === "win") {
      heat += winHeat;
      if (scoreDiff > blowoutThreshold) {
        heat += blowoutBonus;
      }
    } else if (outcome === "loss") {
      heat -= lossHeat;
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

    equals(a: MoodRingRating | undefined, b: MoodRingRating | undefined) {
      return a === b;
    },
  };
}
