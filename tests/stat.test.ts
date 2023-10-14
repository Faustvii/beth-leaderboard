import { describe, expect, test } from "bun:test";
import MatchStatistics from "../src/lib/matchStatistics";

describe("stats", () => {
  test("should be able to calculate highest win&lose streaks", () => {
    const now = new Date().getTime();
    const matches: MatchWithPlayers[] = [
      {
        id: 1,
        blackPlayerOne: {
          id: "1",
          name: "test",
          elo: 1000,
        },
        blackPlayerTwo: {
          id: "2",
          name: "test",
          elo: 1000,
        },
        whitePlayerOne: {
          id: "3",
          name: "test",
          elo: 1000,
        },
        whitePlayerTwo: {
          id: "4",
          name: "test",
          elo: 1000,
        },
        result: "Black",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 1000),
      },
      {
        id: 2,
        blackPlayerOne: {
          id: "1",
          name: "test",
          elo: 1000,
        },
        blackPlayerTwo: {
          id: "2",
          name: "test",
          elo: 1000,
        },
        whitePlayerOne: {
          id: "3",
          name: "test",
          elo: 1000,
        },
        whitePlayerTwo: {
          id: "4",
          name: "test",
          elo: 1000,
        },
        result: "Black",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 999),
      },
      {
        id: 3,
        blackPlayerOne: {
          id: "1",
          name: "test",
          elo: 1000,
        },
        blackPlayerTwo: {
          id: "3",
          name: "test",
          elo: 1000,
        },
        whitePlayerOne: {
          id: "2",
          name: "test",
          elo: 1000,
        },
        whitePlayerTwo: {
          id: "4",
          name: "test",
          elo: 1000,
        },
        result: "Black",
        scoreDiff: 1,
        whiteEloChange: 1,
        blackEloChange: 1,
        createdAt: new Date(now - 998),
      },
      {
        id: 4,
        blackPlayerOne: {
          id: "4",
          name: "test",
          elo: 1000,
        },
        blackPlayerTwo: {
          id: "2",
          name: "test",
          elo: 1000,
        },
        whitePlayerOne: {
          id: "3",
          name: "test",
          elo: 1000,
        },
        whitePlayerTwo: {
          id: "1",
          name: "test",
          elo: 1000,
        },
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
