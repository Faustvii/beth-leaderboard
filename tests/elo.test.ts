import { beforeEach, describe, expect, test } from "bun:test";
import { applyMatchResult, matchEloChange } from "../src/lib/elo";
import { type EloConfig, type GameResult, type Team } from "../src/types/elo";

describe("calculateElo", () => {
  const config: EloConfig = {
    eloFloor: 1000,
  };

  let team1: Team;
  let team2: Team;

  beforeEach(() => {
    team1 = {
      color: "White",
      players: [
        { id: "player1", elo: 1500 },
        { id: "player2", elo: 1400 },
      ],
    };

    team2 = {
      color: "Black",
      players: [
        { id: "player3", elo: 1500 },
        { id: "player4", elo: 1400 },
      ],
    };
  });

  test("kfactor should be 16 when above 2500", () => {
    const elo = 2600;
    const kfactor = 16;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 24 when below 2500 and above 2300", () => {
    const elo = 2350;
    const kfactor = 24;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 32 when below 2300 and above 2100", () => {
    const elo = 2150;
    const kfactor = 32;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 40 when elo below 2100 and above 1900", () => {
    const elo = 1950;
    const kfactor = 40;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 48 when elo below 1900 and above 1700", () => {
    const elo = 1750;
    const kfactor = 48;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 56 when elo below 1700 and above 1600", () => {
    const elo = 1650;
    const kfactor = 56;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("kfactor should be 64 when elo below 1600", () => {
    const elo = 1550;
    const kfactor = 64;
    const expectedElo = kfactor / 2;
    team1.players.forEach((player) => (player.elo = elo));
    team2.players.forEach((player) => (player.elo = elo));
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(elo + expectedElo);
    expect(gameResult.teams[1].players[0]!.elo).toEqual(elo - expectedElo);
  });

  test("elo is rounded correctly", () => {
    team1 = {
      color: "White",
      players: [{ id: "player1", elo: 1400 }],
    };

    team2 = {
      color: "Black",
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
    applyMatchResult(config, gameResult);
    expect(gameResult.teams[0].players[0]!.elo).toEqual(
      player1Elo + expectedElo,
    );
    expect(gameResult.teams[1].players[0]!.elo).toEqual(
      player2Elo - expectedElo,
    );
  });

  test("elo change is positive value", () => {
    team1 = {
      color: "White",
      players: [
        { id: "player1", elo: 1029 },
        { id: "player2", elo: 959 },
      ],
    };

    team2 = {
      color: "Black",
      players: [
        { id: "player2", elo: 1051 },
        { id: "player2", elo: 828 },
      ],
    };

    // results in elo change of 5
    const gameResult: GameResult = {
      outcome: "draw",
      teams: [team1, team2],
    };
    const eloChange = matchEloChange(gameResult);
    expect(eloChange.white).toBeNegative();
    expect(eloChange.black).toBePositive();
  });

  test("elo change is calculated correctly when different kFactors", () => {
    team1 = {
      color: "White",
      players: [
        { id: "player1", elo: 1850 },
        // { id: "player2", elo: 1203 },
      ],
    };

    team2 = {
      color: "Black",
      players: [
        // { id: "player2", elo: 808 },
        { id: "player2", elo: 756 },
      ],
    };

    // results in elo change of 5
    const gameResult: GameResult = {
      outcome: "draw",
      teams: [team1, team2],
    };
    const eloChange = matchEloChange(gameResult);
    expect(eloChange.white).toBe(-24);
    expect(eloChange.black).toBe(32);
  });

  test("should update the Elo ratings of the teams correctly when different kfactors", () => {
    team1 = {
      color: "White",
      players: [{ id: "player1", elo: 1850 }],
    };

    team2 = {
      color: "Black",
      players: [{ id: "player2", elo: 1000 }],
    };
    const gameResult: GameResult = {
      outcome: "loss",
      teams: [team1, team2],
    };

    applyMatchResult(config, gameResult);
    expect(team1.players[0]!.elo).toBe(1850 - 48);
    expect(team2.players[0]!.elo).toBe(1000 + 64);
  });

  test("should update the Elo ratings of the winning team correctly", () => {
    const gameResult: GameResult = {
      outcome: "win",
      teams: [team1, team2],
    };

    applyMatchResult(config, gameResult);

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

    applyMatchResult(config, gameResult);

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

    applyMatchResult(config, gameResult);

    expect(team1.players[0]!.elo).toBe(1500);
    expect(team1.players[1]!.elo).toBe(1400);

    expect(team2.players[0]!.elo).toBe(1500);
    expect(team2.players[1]!.elo).toBe(1400);
  });
});
