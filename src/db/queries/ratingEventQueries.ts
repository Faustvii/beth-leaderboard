import { and, asc, desc, eq } from "drizzle-orm";
import { readDb } from "..";
import { ratingEventTbl } from "../schema/ratingEvent";

export async function getRatingEvents(seasonId: number) {
  return await readDb.query.ratingEventTbl.findMany({
    where: eq(ratingEventTbl.seasonId, seasonId),
    orderBy: [asc(ratingEventTbl.createdAt)],
  });
}

// New function to get events for a specific player in a season
export async function getRatingEventsForPlayer(
  playerId: string,
  seasonId: number,
) {
  return await readDb.query.ratingEventTbl.findMany({
    where: and(
      eq(ratingEventTbl.seasonId, seasonId),
      eq(ratingEventTbl.playerId, playerId),
    ),
    orderBy: [desc(ratingEventTbl.createdAt)], // Newest first
  });
}
