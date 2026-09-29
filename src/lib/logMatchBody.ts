import { type InsertMatch } from "../db/schema/matches";
import {
  filledSeats,
  isSeat,
  seatsToSingles,
  seatsToTeams,
  type Seat,
  type SeatAssignment,
} from "./seats";

export type MatchResult = "White" | "Black" | "Draw";

// For 2v2 the winner is a seat axis, for 1v1 it's the winning player's seat code
export type BoardWinner = "NS" | "EW" | "Draw" | Seat;

export interface LogMatchBody {
  seatN?: string;
  seatE?: string;
  seatS?: string;
  seatW?: string;
  winner?: BoardWinner;
  point_difference: string;
}

export type NormalizedMatch = Omit<
  InsertMatch,
  "id" | "seasonId" | "createdAt"
>;

const AXIS_WINNER: Record<"NS" | "EW" | "Draw", MatchResult> = {
  NS: "White",
  EW: "Black",
  Draw: "Draw",
};

export function normalizeLogMatchBody(
  body: LogMatchBody,
): { ok: true; match: NormalizedMatch } | { ok: false; error: string } {
  const scoreDiff = Number(body.point_difference);
  if (Number.isNaN(scoreDiff)) {
    return { ok: false, error: "Point difference must be a number" };
  }

  const seats: SeatAssignment = {
    N: body.seatN,
    E: body.seatE,
    S: body.seatS,
    W: body.seatW,
  };

  if (filledSeats(seats).length === 4) {
    if (!body.winner || isSeat(body.winner)) {
      return { ok: false, error: "Pick who won" };
    }
    const seated = seatsToTeams(seats);
    if (!seated.ok) return seated;
    return {
      ok: true,
      match: { ...seated.teams, result: AXIS_WINNER[body.winner], scoreDiff },
    };
  }

  const singles = seatsToSingles(seats);
  if (!singles.ok) return singles;
  const { sides, ...teams } = singles.teams;

  let result: MatchResult;
  if (body.winner === "Draw") {
    result = "Draw";
  } else if (isSeat(body.winner) && sides[body.winner]) {
    result = sides[body.winner]!;
  } else {
    return { ok: false, error: "Pick who won" };
  }

  return { ok: true, match: { ...teams, result, scoreDiff } };
}
