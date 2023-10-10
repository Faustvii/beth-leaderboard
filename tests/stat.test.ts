import { describe, expect, test } from "bun:test";
import { type Match } from "../src/db/schema/matches";
import MatchStatistics from "../src/lib/matchStatistics";

describe("stats", () => {
  test("should be able to calculate highest win&lose streaks", () => {
    const now = new Date().getTime();
    const matches: Match[] = [
      {
        id: 1,
        blackPlayerOne: "1",
        blackPlayerTwo: "2",
        whitePlayerOne: "3",
        whitePlayerTwo: "4",
        result: "Black",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 1000),
      },
      {
        id: 2,
        blackPlayerOne: "1",
        blackPlayerTwo: "2",
        whitePlayerOne: "3",
        whitePlayerTwo: "4",
        result: "Black",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 999),
      },
      {
        id: 3,
        blackPlayerOne: "1",
        blackPlayerTwo: "3",
        whitePlayerOne: "2",
        whitePlayerTwo: "4",
        result: "Black",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 998),
      },
      {
        id: 4,
        blackPlayerOne: "4",
        blackPlayerTwo: "2",
        whitePlayerOne: "3",
        whitePlayerTwo: "1",
        result: "White",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 997),
      },
    ];
    const { highestLoseStreak, highestWinStreak } =
      MatchStatistics.highestStreak(matches);
    //player 1 has 4 wins in a row
    //player 4 has 4 losses in a row
    expect(highestWinStreak.player).toEqual("1");
    expect(highestWinStreak.streak).toEqual(4);
    expect(highestLoseStreak.player).toEqual("4");
    expect(highestLoseStreak.streak).toEqual(4);
  });
});
