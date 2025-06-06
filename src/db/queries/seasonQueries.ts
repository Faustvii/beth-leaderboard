import { and, eq, gte, lte } from "drizzle-orm";
import { readDb } from "..";
import { seasonsTbl } from "../schema";
import { allTimeSeason } from "../schema/season";

export const getActiveSeason = async () => {
  const now = new Date();
  const season = await readDb.query.seasonsTbl.findFirst({
    where: and(lte(seasonsTbl.startAt, now), gte(seasonsTbl.endAt, now)),
  });
  return season;
};

export const getSeason = async (id: number) => {
  if (id === 0) {
    return allTimeSeason;
  }

  return await readDb.query.seasonsTbl.findFirst({
    where: eq(seasonsTbl.id, id),
  });
};

export const getSeasons = async () => {
  return [allTimeSeason, ...(await readDb.query.seasonsTbl.findMany())];
};

export const deleteSeason = async (seasonId: number) => {
  const deletedSeason = await readDb
    .delete(seasonsTbl)
    .where(eq(seasonsTbl.id, seasonId))
    .returning();

  return deletedSeason;
};
