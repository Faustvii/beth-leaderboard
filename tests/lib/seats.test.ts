import { describe, expect, it } from "bun:test";
import { normalizeLogMatchBody } from "../../src/lib/logMatchBody";
import {
  getPlayerSeat,
  positionsRecorded,
  seatsToSingles,
  seatsToTeams,
  sideLabel,
  teamLabel,
} from "../../src/lib/seats";

const seated = {
  whitePlayerOne: { id: "a" },
  whitePlayerTwo: { id: "b" },
  blackPlayerOne: { id: "c" },
  blackPlayerTwo: { id: "d" },
  positionsRecorded: true,
} as const;

const unseated = { ...seated, positionsRecorded: false };

describe("seatsToTeams", () => {
  it("maps N/S to white and E/W to black", () => {
    const result = seatsToTeams({ N: "a", E: "c", S: "b", W: "d" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.teams).toEqual({
      whitePlayerOne: "a",
      whitePlayerTwo: "b",
      blackPlayerOne: "c",
      blackPlayerTwo: "d",
      positionsRecorded: true,
    });
  });

  it("rejects an empty seat", () => {
    const result = seatsToTeams({ N: "a", E: "c", S: "", W: "d" });
    expect(result.ok).toBe(false);
  });

  it("rejects the same player in two seats", () => {
    const result = seatsToTeams({ N: "a", E: "a", S: "b", W: "d" });
    expect(result.ok).toBe(false);
  });
});

describe("teamLabel / positionsRecorded / getPlayerSeat", () => {
  it("uses seat names only when positions were recorded", () => {
    expect(positionsRecorded(seated)).toBe(true);
    expect(teamLabel("White", seated)).toBe("Tog/Kantine team");
    expect(teamLabel("Black", seated)).toBe("Mute/Rønslev team");
    expect(positionsRecorded(unseated)).toBe(false);
    expect(teamLabel("White", unseated)).toBe("Team White");
    expect(teamLabel("Black", unseated)).toBe("Team Black");
  });

  it("derives a player's seat from their column", () => {
    expect(getPlayerSeat(seated, "a")).toBe("N");
    expect(getPlayerSeat(seated, "b")).toBe("S");
    expect(getPlayerSeat(seated, "c")).toBe("E");
    expect(getPlayerSeat(seated, "d")).toBe("W");
    expect(getPlayerSeat(seated, "zzz")).toBeNull();
    expect(getPlayerSeat(unseated, "a")).toBeNull();
  });
});

describe("normalizeLogMatchBody", () => {
  it("derives teams and winner from a board submission", () => {
    const result = normalizeLogMatchBody({
      seatN: "a",
      seatE: "c",
      seatS: "b",
      seatW: "d",
      winner: "EW",
      point_difference: "45",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.match.result).toBe("Black");
    expect(result.match.scoreDiff).toBe(45);
    expect(result.match.whitePlayerOne).toBe("a");
    expect(result.match.blackPlayerTwo).toBe("d");
    expect(result.match.positionsRecorded).toBe(true);
  });

  it("requires a winner and four players on the board", () => {
    expect(
      normalizeLogMatchBody({
        seatN: "a",
        seatE: "c",
        seatS: "b",
        seatW: "d",
        point_difference: "45",
      }).ok,
    ).toBe(false);
    expect(
      normalizeLogMatchBody({
        seatN: "a",
        seatE: "c",
        seatS: "b",
        winner: "NS",
        point_difference: "45",
      }).ok,
    ).toBe(false);
  });

  it("derives a 1v1 from two opposite seats and a seat-code winner", () => {
    const result = normalizeLogMatchBody({
      seatN: "a",
      seatS: "b",
      winner: "S",
      point_difference: "20",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.match.whitePlayerOne).toBe("a");
    expect(result.match.blackPlayerOne).toBe("b");
    expect(result.match.whitePlayerTwo).toBeNull();
    expect(result.match.result).toBe("Black");
    expect(result.match.positionsRecorded).toBe(false);
  });

  it("accepts a 1v1 draw and rejects a team-axis winner for a 1v1", () => {
    expect(
      normalizeLogMatchBody({
        seatE: "a",
        seatW: "b",
        winner: "Draw",
        point_difference: "0",
      }).ok,
    ).toBe(true);
    expect(
      normalizeLogMatchBody({
        seatE: "a",
        seatW: "b",
        winner: "NS",
        point_difference: "0",
      }).ok,
    ).toBe(false);
    // the winner must be one of the two occupied seats
    expect(
      normalizeLogMatchBody({
        seatE: "a",
        seatW: "b",
        winner: "N",
        point_difference: "0",
      }).ok,
    ).toBe(false);
  });

  it("rejects three seated players and adjacent 1v1 seating", () => {
    expect(
      normalizeLogMatchBody({
        seatN: "a",
        seatE: "c",
        seatS: "b",
        winner: "NS",
        point_difference: "20",
      }).ok,
    ).toBe(false);
    const adjacent = normalizeLogMatchBody({
      seatN: "a",
      seatE: "b",
      winner: "N",
      point_difference: "20",
    });
    expect(adjacent.ok).toBe(false);
    if (adjacent.ok) return;
    expect(adjacent.error).toContain("opposite");
  });
});

describe("seatsToSingles", () => {
  it("maps N/E to white and S/W to black", () => {
    const ns = seatsToSingles({ N: "a", S: "b" });
    expect(ns.ok).toBe(true);
    if (!ns.ok) return;
    expect(ns.teams.whitePlayerOne).toBe("a");
    expect(ns.teams.blackPlayerOne).toBe("b");
    expect(ns.teams.sides).toEqual({ N: "White", S: "Black" });

    const ew = seatsToSingles({ W: "b", E: "a" });
    expect(ew.ok).toBe(true);
    if (!ew.ok) return;
    expect(ew.teams.whitePlayerOne).toBe("a");
    expect(ew.teams.sides).toEqual({ E: "White", W: "Black" });
  });

  it("rejects adjacent seats, wrong counts and duplicate players", () => {
    expect(seatsToSingles({ N: "a", E: "b" }).ok).toBe(false);
    expect(seatsToSingles({ N: "a" }).ok).toBe(false);
    expect(seatsToSingles({ N: "a", S: "b", E: "c" }).ok).toBe(false);
    expect(seatsToSingles({ N: "a", S: "a" }).ok).toBe(false);
  });
});

describe("sideLabel", () => {
  const players = {
    whitePlayerOne: { id: "a", name: "Anna" },
    blackPlayerOne: { id: "c", name: "Carl" },
  };
  it("names the player for a 1v1", () => {
    const singles = {
      ...unseated,
      ...players,
      whitePlayerTwo: null,
      blackPlayerTwo: null,
    };
    expect(sideLabel("White", singles)).toBe("Anna");
    expect(sideLabel("Black", singles)).toBe("Carl");
  });
  it("falls back to team labels for 2v2", () => {
    const doubles = {
      ...players,
      whitePlayerTwo: { id: "b" },
      blackPlayerTwo: { id: "d" },
    };
    expect(sideLabel("White", { ...seated, ...doubles })).toBe(
      "Tog/Kantine team",
    );
    expect(sideLabel("Black", { ...unseated, ...doubles })).toBe("Team Black");
  });
});
