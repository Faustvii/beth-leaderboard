import { isDefined } from "./utils";

export const seatValues = ["N", "E", "S", "W"] as const;
export type Seat = (typeof seatValues)[number];

export type Team = "White" | "Black";
// Still using white/black as the spine of the code
export const TEAM_LABELS: Record<Team, string> = {
  White: "Tog/Kantine team",
  Black: "Mute/Rønslev team",
};

export const SEAT_TEAM: Record<Seat, Team> = {
  N: "White",
  S: "White",
  E: "Black",
  W: "Black",
};

export const TEAM_SEATS: Record<Team, readonly [Seat, Seat]> = {
  White: ["N", "S"],
  Black: ["E", "W"],
};

export const SEAT_NAMES: Record<Seat, string> = {
  N: "1",
  E: "2",
  S: "3",
  W: "4",
};

export function teamSeatNames(team: Team): string {
  return TEAM_SEATS[team]
    .map((seat) => SEAT_NAMES[seat])
    .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .join(" + ");
}

interface SeatedFields {
  whitePlayerOneSeat: Seat | null;
  whitePlayerTwoSeat: Seat | null;
  blackPlayerOneSeat: Seat | null;
  blackPlayerTwoSeat: Seat | null;
}

interface PlayerIdFields {
  whitePlayerOne: { id: string };
  whitePlayerTwo: { id: string } | null;
  blackPlayerOne: { id: string };
  blackPlayerTwo: { id: string } | null;
}

export function isSeat(value: unknown): value is Seat {
  return typeof value === "string" && seatValues.includes(value as Seat);
}

export function seatTeam(seat: Seat): Team {
  return SEAT_TEAM[seat];
}

export function matchHasSeats(match: SeatedFields): boolean {
  return (
    match.whitePlayerOneSeat !== null &&
    match.whitePlayerTwoSeat !== null &&
    match.blackPlayerOneSeat !== null &&
    match.blackPlayerTwoSeat !== null
  );
}

export function teamLabel(team: Team, match: SeatedFields): string {
  return matchHasSeats(match) ? TEAM_LABELS[team] : `Team ${team}`;
}

export function getPlayerSeat(
  match: SeatedFields & PlayerIdFields,
  userId: string,
): Seat | null {
  if (match.whitePlayerOne.id === userId) return match.whitePlayerOneSeat;
  if (match.whitePlayerTwo?.id === userId) return match.whitePlayerTwoSeat;
  if (match.blackPlayerOne.id === userId) return match.blackPlayerOneSeat;
  if (match.blackPlayerTwo?.id === userId) return match.blackPlayerTwoSeat;
  return null;
}

export interface SeatedTeams {
  whitePlayerOne: string;
  whitePlayerTwo: string;
  blackPlayerOne: string;
  blackPlayerTwo: string;
  whitePlayerOneSeat: Seat;
  whitePlayerTwoSeat: Seat;
  blackPlayerOneSeat: Seat;
  blackPlayerTwoSeat: Seat;
}

export type SeatAssignment = Partial<Record<Seat, string | undefined>>;

export function filledSeats(seats: SeatAssignment): Seat[] {
  return seatValues.filter((seat) => (seats[seat]?.trim() ?? "") !== "");
}

const OPPOSITE: Record<Seat, Seat> = { N: "S", S: "N", E: "W", W: "E" };

export interface SinglesTeams {
  whitePlayerOne: string;
  whitePlayerTwo: null;
  blackPlayerOne: string;
  blackPlayerTwo: null;
  whitePlayerOneSeat: null;
  whitePlayerTwoSeat: null;
  blackPlayerOneSeat: null;
  blackPlayerTwoSeat: null;
  sides: Partial<Record<Seat, Team>>;
}

export function seatsToSingles(
  seats: SeatAssignment,
): { ok: true; teams: SinglesTeams } | { ok: false; error: string } {
  const filled = filledSeats(seats);
  if (filled.length !== 2) {
    return {
      ok: false,
      error:
        "Seat exactly two players (opposite each other) for a 1v1, or all four for a 2v2",
    };
  }
  const [a, b] = filled;
  if (OPPOSITE[a] !== b) {
    return { ok: false, error: "In a 1v1 the players sit opposite each other" };
  }
  const white = a === "N" || a === "E" ? a : b;
  const black = OPPOSITE[white];
  const whiteId = seats[white]!.trim();
  const blackId = seats[black]!.trim();
  if (whiteId === blackId) {
    return {
      ok: false,
      error: "The same player can't participate multiple times",
    };
  }
  return {
    ok: true,
    teams: {
      whitePlayerOne: whiteId,
      whitePlayerTwo: null,
      blackPlayerOne: blackId,
      blackPlayerTwo: null,
      whitePlayerOneSeat: null,
      whitePlayerTwoSeat: null,
      blackPlayerOneSeat: null,
      blackPlayerTwoSeat: null,
      sides: { [white]: "White", [black]: "Black" },
    },
  };
}

interface SidesFields extends SeatedFields {
  whitePlayerOne: { name: string };
  blackPlayerOne: { name: string };
  whitePlayerTwo: unknown;
  blackPlayerTwo: unknown;
}

export function isSingles(match: {
  whitePlayerTwo: unknown;
  blackPlayerTwo: unknown;
}): boolean {
  return match.whitePlayerTwo === null && match.blackPlayerTwo === null;
}


 //Display name of a side, the player's own name for a 1v1

export function sideLabel(team: Team, match: SidesFields): string {
  if (isSingles(match)) {
    return team === "White"
      ? match.whitePlayerOne.name
      : match.blackPlayerOne.name;
  }
  return teamLabel(team, match);
}


export function seatsToTeams(
  seats: SeatAssignment,
): { ok: true; teams: SeatedTeams } | { ok: false; error: string } {
  const ids = seatValues.map((seat) => {
    const id = seats[seat]?.trim();
    return id === "" ? undefined : id;
  });
  if (ids.some((id) => !isDefined(id))) {
    return { ok: false, error: "All four seats must have a player" };
  }
  if (new Set(ids).size !== ids.length) {
    return {
      ok: false,
      error: "The same player can't participate multiple times",
    };
  }

  return {
    ok: true,
    teams: {
      whitePlayerOne: seats.N!,
      whitePlayerOneSeat: "N",
      whitePlayerTwo: seats.S!,
      whitePlayerTwoSeat: "S",
      blackPlayerOne: seats.E!,
      blackPlayerOneSeat: "E",
      blackPlayerTwo: seats.W!,
      blackPlayerTwoSeat: "W",
    },
  };
}

export interface AdminSeatInput {
  white1Seat?: string;
  white2Seat?: string;
  black1Seat?: string;
  black2Seat?: string;
}

export function validateAdminSeats(
  input: AdminSeatInput,
): { ok: true; seats: SeatedFields } | { ok: false; error: string } {
  const raw = [
    input.white1Seat,
    input.white2Seat,
    input.black1Seat,
    input.black2Seat,
  ].map((s) => (s === undefined || s === "" ? null : s));

  if (raw.every((s) => s === null)) {
    return {
      ok: true,
      seats: {
        whitePlayerOneSeat: null,
        whitePlayerTwoSeat: null,
        blackPlayerOneSeat: null,
        blackPlayerTwoSeat: null,
      },
    };
  }

  if (!raw.every(isSeat)) {
    return { ok: false, error: "Either set all four seats or none" };
  }

  const [w1, w2, b1, b2] = raw;
  const whiteOk = seatTeam(w1) === "White" && seatTeam(w2) === "White";
  const blackOk = seatTeam(b1) === "Black" && seatTeam(b2) === "Black";
  if (!whiteOk || !blackOk) {
    return {
      ok: false,
      error: `${TEAM_LABELS.White} must sit in seats ${teamSeatNames("White")} and ${TEAM_LABELS.Black} in seats ${teamSeatNames("Black")}`,
    };
  }
  if (w1 === w2 || b1 === b2) {
    return { ok: false, error: "Two players can't share a seat" };
  }

  return {
    ok: true,
    seats: {
      whitePlayerOneSeat: w1,
      whitePlayerTwoSeat: w2,
      blackPlayerOneSeat: b1,
      blackPlayerTwoSeat: b2,
    },
  };
}
