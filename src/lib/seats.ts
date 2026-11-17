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

export type PlayerSlot =
  | "whitePlayerOne"
  | "whitePlayerTwo"
  | "blackPlayerOne"
  | "blackPlayerTwo";

export const SLOT_SEAT: Record<PlayerSlot, Seat> = {
  whitePlayerOne: "N",
  whitePlayerTwo: "S",
  blackPlayerOne: "E",
  blackPlayerTwo: "W",
};

export const SEAT_SLOT: Record<Seat, PlayerSlot> = {
  N: "whitePlayerOne",
  S: "whitePlayerTwo",
  E: "blackPlayerOne",
  W: "blackPlayerTwo",
};

const OPPOSITE: Record<Seat, Seat> = { N: "S", S: "N", E: "W", W: "E" };

export function teamSeatNames(team: Team): string {
  return TEAM_SEATS[team]
    .map((seat) => SEAT_NAMES[seat])
    .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .join(" + ");
}

interface PositionFields {
  positionsRecorded: boolean;
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

export function positionsRecorded(match: PositionFields): boolean {
  return match.positionsRecorded;
}

export function teamLabel(team: Team, match: PositionFields): string {
  return match.positionsRecorded ? TEAM_LABELS[team] : `Team ${team}`;
}

export function getPlayerSeat(
  match: PositionFields & PlayerIdFields,
  userId: string,
): Seat | null {
  if (!match.positionsRecorded) return null;
  if (match.whitePlayerOne.id === userId) return SLOT_SEAT.whitePlayerOne;
  if (match.whitePlayerTwo?.id === userId) return SLOT_SEAT.whitePlayerTwo;
  if (match.blackPlayerOne.id === userId) return SLOT_SEAT.blackPlayerOne;
  if (match.blackPlayerTwo?.id === userId) return SLOT_SEAT.blackPlayerTwo;
  return null;
}

export interface SeatedTeams {
  whitePlayerOne: string;
  whitePlayerTwo: string;
  blackPlayerOne: string;
  blackPlayerTwo: string;
  positionsRecorded: true;
}

export type SeatAssignment = Partial<Record<Seat, string | undefined>>;

export function filledSeats(seats: SeatAssignment): Seat[] {
  return seatValues.filter((seat) => (seats[seat]?.trim() ?? "") !== "");
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
      whitePlayerTwo: seats.S!,
      blackPlayerOne: seats.E!,
      blackPlayerTwo: seats.W!,
      positionsRecorded: true,
    },
  };
}

export interface SinglesTeams {
  whitePlayerOne: string;
  whitePlayerTwo: null;
  blackPlayerOne: string;
  blackPlayerTwo: null;
  positionsRecorded: false;
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
      positionsRecorded: false,
      sides: { [white]: "White", [black]: "Black" },
    },
  };
}

interface SidesFields extends PositionFields {
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

//Display label for a team, either the seat-based names or the colour wording
export function sideLabel(team: Team, match: SidesFields): string {
  if (isSingles(match)) {
    return team === "White"
      ? match.whitePlayerOne.name
      : match.blackPlayerOne.name;
  }
  return teamLabel(team, match);
}
