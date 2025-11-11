/** @author Claude Tests for the Underdog Rating System. */

import { describe, expect, it } from "bun:test";
import {
  type MatchWithRatings,
  type PlayerWithRating,
} from "../../../src/lib/ratings/rating";
import { underdog } from "../../../src/lib/ratings/underdogRatingSystem";

describe("Underdog Rating System", () => {
  const config = {
    basePoints: 25,
    ratingDiffMultiplier: 0.125,
    maxRatingDiff: 1000,
    upsetBonus: 50,
    minUpsetDiff: 100,
    teamContributionFactor: 0.3,
  };

  const system = underdog(config);

  const createPlayer = (
    id: string,
    rating: number,
  ): PlayerWithRating<number> => ({
    player: { id, name: `Player ${id}`, nickname: `P${id}` },
    rating,
  });

  const createMatch = (
    whitePlayerOne: PlayerWithRating<number>,
    whitePlayerTwo: PlayerWithRating<number> | null,
    blackPlayerOne: PlayerWithRating<number>,
    blackPlayerTwo: PlayerWithRating<number> | null,
    result: "White" | "Black" | "Draw",
  ): MatchWithRatings<number> => ({
    id: 1,
    whitePlayerOne,
    whitePlayerTwo,
    blackPlayerOne,
    blackPlayerTwo,
    result,
    scoreDiff: 1,
    createdAt: new Date(),
  });

  it("should maintain default rating for draws", () => {
    const player1 = createPlayer("1", 1000);
    const player2 = createPlayer("2", 1000);
    const match = createMatch(player1, null, player2, null, "Draw");
    const result = system.rateMatch(match);
    expect(result[0].rating).toBe(1000);
    expect(result[1].rating).toBe(1000);
  });

  it("should award more points for upsets", () => {
    const underdogPlayer = createPlayer("1", 800);
    const favorite = createPlayer("2", 1200);
    const match = createMatch(underdogPlayer, null, favorite, null, "White");
    const result = system.rateMatch(match);

    // Underdog should get base points + diff points + upset bonus
    const minExpectedPoints = config.basePoints + config.upsetBonus;
    expect(result[0].rating).toBeGreaterThan(800 + minExpectedPoints);
    // Favorite should lose at least base points
    expect(result[1].rating).toBeLessThan(1200 - config.basePoints);
  });

  it("should handle team dynamics correctly", () => {
    const strongPlayer = createPlayer("1", 1200);
    const weakPlayer = createPlayer("2", 800);
    const opponent1 = createPlayer("3", 1000);
    const opponent2 = createPlayer("4", 1000);
    const match = createMatch(
      strongPlayer,
      weakPlayer,
      opponent1,
      opponent2,
      "White",
    );
    const result = system.rateMatch(match);

    const strongPlayerResult = result.find((p) => p.player.id === "1");
    const weakPlayerResult = result.find((p) => p.player.id === "2");

    // Strong player should get base points with team contribution factor
    expect(strongPlayerResult?.rating).toBeLessThan(
      1200 + config.basePoints * 1.2,
    ); // Max 20% boost from team factor
    // Weak player should get:
    // - Base points for each opponent (2x base points)
    // - Upset bonus for each opponent (2x upset bonus)
    // - Team contribution factor applied to total (1 + (400 * 0.3) / 1000 = 1.12)
    const totalPoints = config.basePoints * 2 + config.upsetBonus * 2;
    const teamContributionFactor =
      1 + (400 * config.teamContributionFactor) / 1000;
    expect(weakPlayerResult?.rating).toBeLessThan(
      800 + totalPoints * teamContributionFactor,
    );
  });

  it("should respect max rating difference", () => {
    const player1 = createPlayer("1", 1000);
    const player2 = createPlayer("2", 3000);
    const match = createMatch(player1, null, player2, null, "White");
    const result = system.rateMatch(match);

    // Points should be capped at maxRatingDiff
    const maxPoints =
      config.basePoints +
      config.maxRatingDiff * config.ratingDiffMultiplier +
      config.upsetBonus;
    expect(result[0].rating).toBeLessThanOrEqual(1000 + maxPoints);
  });

  it("should handle minimum upset difference requirement", () => {
    const player1 = createPlayer("1", 1000);
    const player2 = createPlayer("2", 1090); // Just below minUpsetDiff
    const match = createMatch(player1, null, player2, null, "White");
    const result = system.rateMatch(match);

    // Should not get upset bonus since difference is less than minUpsetDiff
    expect(result[0].rating).toBeLessThan(
      1000 + config.basePoints + config.upsetBonus,
    );
  });

  it("should handle custom configuration", () => {
    const customConfig = {
      basePoints: 50,
      ratingDiffMultiplier: 0.2,
      maxRatingDiff: 500,
      upsetBonus: 100,
      minUpsetDiff: 200,
      teamContributionFactor: 0.5,
    };
    const customSystem = underdog(customConfig);
    const player1 = createPlayer("1", 800);
    const player2 = createPlayer("2", 1200);
    const match = createMatch(player1, null, player2, null, "White");
    const result = customSystem.rateMatch(match);

    // Should use custom values
    const minExpectedPoints = customConfig.basePoints + customConfig.upsetBonus;
    expect(result[0].rating).toBeGreaterThan(800 + minExpectedPoints);
  });

  it("should not give excessive points to strong team for expected win", () => {
    const strongPlayer1 = createPlayer("1", 2000);
    const strongPlayer2 = createPlayer("2", 1900);
    const weakPlayer1 = createPlayer("3", 1000);
    const weakPlayer2 = createPlayer("4", 900);
    const match = createMatch(
      strongPlayer1,
      strongPlayer2,
      weakPlayer1,
      weakPlayer2,
      "White",
    );
    const result = system.rateMatch(match);

    // Strong players should only get base points with team contribution factor
    const sp1 = result.find((p) => p.player.id === "1");
    const sp2 = result.find((p) => p.player.id === "2");
    expect(sp1?.rating).toBeLessThan(2000 + config.basePoints * 1.2);
    expect(sp2?.rating).toBeLessThan(1900 + config.basePoints * 1.2);
  });
});
