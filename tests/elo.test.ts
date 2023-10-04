import { beforeEach, describe, expect, test } from "bun:test";
import { calculateElo } from "../src/lib/elo";
import { type EloConfig, type GameResult, type Team } from "../src/types/elo";

describe("calculateElo", () => {
  const config: EloConfig = {
    eloFloor: 1000,
  };

  let team1: Team;
  let team2: Team;

  beforeEach(() => {
    team1 = {
      id: "team1",
      players: [
        { id: "player1", elo: 1500 },
        { id: "player2", elo: 1400 },
      ],
    };

    team2 = {
      id: "team2",
      players: [
        { id: "player3", elo: 1500 },
        { id: "player4", elo: 1400 },
      ],
    };
  });

  test("kfactor should be 16 when above 2000", () => {
    const elo = 2100;
    const kfactor = 16;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    calculateElo(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 32 when elo below 2000 and above 1700", () => {
    const elo = 1701;
    const kfactor = 32;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    calculateElo(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 64 when elo below 1700", () => {
    const elo = 1699;
    const kfactor = 64;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    calculateElo(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("elo is rounded correctly", () => {
    team1 = {
      id: "team1",
      players: [{ id: "player1", elo: 1400 }],
    };

    team2 = {
      id: "team2",
      players: [{ id: "player2", elo: 1600 }],
    };
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    //48.62 elo change
    const expectedElo = 49;
    const player1Elo = team1.players[0]!.elo;
    const player2Elo = team2.players[0]!.elo;
    calculateElo(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(
      player1Elo + expectedElo,
    );
    expect(gameResult.teams[1].players[0]!.elo).toEqual(
      player2Elo - expectedElo,
    );
  });

  test("should update the Elo ratings of the winning team correctly", () => {
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };

    calculateElo(config, gameResult);

    expect(team1.players[0]!.elo).toBeGreaterThan(1500);
    expect(team1.players[1]!.elo).toBeGreaterThan(1400);
    expect(team2.players[0]!.elo).toBeLessThan(1500);
    expect(team2.players[1]!.elo).toBeLessThan(1400);
  });

  test("should update the Elo ratings of the losing team correctly", () => {
    const gameResult: GameResult = {
      outcome: "loss",
      teams: [team1, team2],
    };

    calculateElo(config, gameResult);

    expect(team1.players[0]!.elo).toBeLessThan(1500);
    expect(team1.players[1]!.elo).toBeLessThan(1400);
    expect(team2.players[0]!.elo).toBeGreaterThan(1500);
    expect(team2.players[1]!.elo).toBeGreaterThan(1400);
  });

  test("should update the Elo ratings of both teams correctly in the case of a draw", () => {
    const gameResult: GameResult = {
      outcome: "draw",
      teams: [team1, team2],
    };

    calculateElo(config, gameResult);

    expect(team1.players[0]!.elo).toBe(1500);
    expect(team1.players[1]!.elo).toBe(1400);

    expect(team2.players[0]!.elo).toBe(1500);
    expect(team2.players[1]!.elo).toBe(1400);
  });
});
