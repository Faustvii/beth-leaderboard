import { describe, expect, it } from "bun:test";
import MatchStatistics from "../../src/lib/matchStatistics";
import { type Match } from "../../src/lib/ratings/rating";

const player = (id: string) => ({ id, name: id, nickname: id });

let nextId = 1;
const seatedMatch = (
  result: Match["result"],
  players: Partial<
    Pick<
      Match,
      "whitePlayerOne" | "whitePlayerTwo" | "blackPlayerOne" | "blackPlayerTwo"
    >
  > = {},
): Match => ({
  id: nextId++,
  whitePlayerOne: player("a"),
  whitePlayerTwo: player("b"),
  blackPlayerOne: player("c"),
  blackPlayerTwo: player("d"),
  result,
  scoreDiff: 10,
  createdAt: new Date(),
  seasonId: 1,
  positionsRecorded: true,
  ...players,
});

const unseatedMatch = (result: Match["result"]): Match => ({
  ...seatedMatch(result),
  positionsRecorded: false,
});

describe("MatchStatistics.winsBySeat", () => {
  it("returns zeros without NaN when no positions were recorded", () => {
    const stats = MatchStatistics.winsBySeat([unseatedMatch("White")]);
    expect(stats.totalGames).toBe(0);
    expect(stats.seats.N.procentage).toBe(0);
    expect(stats.teams.White.procentage).toBe(0);
    expect(stats.draws.procentage).toBe(0);
  });

  it("counts wins per seat and per team, skipping unpositioned matches", () => {
    const stats = MatchStatistics.winsBySeat([
      seatedMatch("White"),
      seatedMatch("Black"),
      seatedMatch("White", {
        whitePlayerOne: player("b"),
        whitePlayerTwo: player("a"),
      }),
      seatedMatch("Draw"),
      unseatedMatch("Black"),
    ]);
    expect(stats.totalGames).toBe(4);
    expect(stats.seats.N).toEqual({ games: 4, wins: 2, procentage: 50 });
    expect(stats.seats.E).toEqual({ games: 4, wins: 1, procentage: 25 });
    expect(stats.teams.White.label).toBe("Tog/Kantine team");
    expect(stats.teams.White.wins).toBe(2);
    expect(stats.teams.White.procentage).toBe(50);
    expect(stats.teams.Black.wins).toBe(1);
    expect(stats.draws.count).toBe(1);
  });
});

describe("MatchStatistics.playerWinsBySeat", () => {
  it("only counts the seat the player actually sat in", () => {
    const stats = MatchStatistics.playerWinsBySeat(
      [
        seatedMatch("White"),
        seatedMatch("Black", {
          whitePlayerOne: player("b"),
          whitePlayerTwo: player("a"),
        }),
        seatedMatch("Draw"),
      ],
      "a",
    );
    expect(stats.seats.N).toEqual({ games: 2, wins: 1, procentage: 50 });
    expect(stats.seats.S).toEqual({ games: 1, wins: 0, procentage: 0 });
    expect(stats.seats.E.games).toBe(0);
    expect(stats.teams.White.wins).toBe(1);
    expect(stats.teams.Black.wins).toBe(0);
    expect(stats.totalGames).toBe(3);
  });
});
