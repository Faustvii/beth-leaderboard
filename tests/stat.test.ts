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
        seasonId: 2,
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
        seasonId: 2,
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
        seasonId: 2,
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
        seasonId: 2,
      },
    ];
    const { highestLoseStreak, highestWinStreak } =
      MatchStatistics.highestStreak(matches);
    //player 1 has 4 wins in a row
    //player 4 has 4 losses in a row
    expect(highestWinStreak.player?.id).toEqual("1");
    expect(highestWinStreak.streak).toEqual(4);
    expect(highestLoseStreak.player?.id).toEqual("4");
    expect(highestLoseStreak.streak).toEqual(4);
  });

  test("should reset streak when there are breaks in the streak", () => {
    const now = new Date().getTime();
    const matches: MatchWithPlayers[] = [];
    for (let i = 0; i < 3; i++) {
      const match = generateMatch(new Date(now + i * 5000));
      match.id = i;
      matches.push(match);
    }
    for (let i = 0; i < 2; i++) {
      const match = generateMatch(new Date(now + (i + 25) * 5000));
      match.id = i + 25;
      match.result = "Black";
      matches.push(match);
    }
    for (let i = 0; i < 2; i++) {
      const match = generateMatch(new Date(now + (i + 45) * 5000));
      match.id = i + 45;
      match.result = "White";
      matches.push(match);
    }
    const { highestLoseStreak, highestWinStreak } =
      MatchStatistics.highestStreak(matches);
    //player 1 has 3 wins in a row
    //player 2 has 3 losses in a row
    expect(highestWinStreak.player?.id).toEqual("1");
    expect(highestWinStreak.streak).toEqual(3);
    expect(highestLoseStreak.player?.id).toEqual("2");
    expect(highestLoseStreak.streak).toEqual(3);
  });
});

function generateMatch(createdAt: Date): MatchWithPlayers {
  return {
    id: 1,
    whitePlayerOne: {
      id: "1",
      name: "test",
      elo: 1000,
    },
    blackPlayerOne: {
      id: "2",
      name: "test",
      elo: 1000,
    },
    blackPlayerTwo: null,
    whitePlayerTwo: null,
    result: "White",
    scoreDiff: 1,
    whiteEloChange: 1,
    blackEloChange: 1,
    createdAt: createdAt,
    seasonId: 2,
  };
}
