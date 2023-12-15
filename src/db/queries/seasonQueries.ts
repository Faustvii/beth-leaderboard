import { and, gte, lte } from "drizzle-orm";
import { readDb } from "..";
import { seasonsTbl } from "../schema";

export const getActiveSeason = async () => {
  const now = new Date();
  const season = await readDb.query.seasonsTbl.findFirst({
    where: and(lte(seasonsTbl.startAt, now), gte(seasonsTbl.endAt, now)),
  });
  return season;
};
