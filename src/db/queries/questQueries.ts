import { and, eq, isNull } from "drizzle-orm";
import { readDb, type CrokDbQueryable } from "..";
import { type Quest } from "../../lib/quest";
import { MapQuests } from "../../lib/quests/questMapper";
import { questTbl } from "../schema";

export const getQuests = async (
  db?: CrokDbQueryable,
): Promise<Quest<unknown>[]> => {
  const database = db ?? readDb;
  const result = await database.query.questTbl.findMany({});

  return MapQuests(result);
};

export const getActiveQuests = async (
  db?: CrokDbQueryable,
): Promise<Quest<unknown>[]> => {
  const database = db ?? readDb;
  const result = await database.query.questTbl.findMany({
    where: isNull(questTbl.resolvedAt),
  });

  return MapQuests(result);
};

export const getActiveQuestsForPlayer = async (
  playerId: string,
  db?: CrokDbQueryable,
): Promise<Quest<unknown>[]> => {
  const database = db ?? readDb;
  const result = await database.query.questTbl.findMany({
    where: and(eq(questTbl.playerId, playerId), isNull(questTbl.resolvedAt)),
  });

  return MapQuests(result);
};
