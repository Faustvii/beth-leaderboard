import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { readDb, type CrokDbQueryable } from "..";
import { notEmpty, unique } from "../../lib";
import { type Match } from "../../lib/rating";
import { matches, userTbl } from "../schema";
import { type Match as DbMatch } from "../schema/matches";

export const getMatches = async (seasonId: number): Promise<Match[]> => {
  const result = await readDb.query.matches.findMany({
    where: eq(matches.seasonId, seasonId),
  });

  return getMatchesWithPlayers(result);
};

export const getMatchesAfterDate = async (
  seasonId: number,
  date: Date,
  db?: CrokDbQueryable,
): Promise<Match[]> => {
  const database = db ?? readDb;
  const result = await database.query.matches.findMany({
    where: and(eq(matches.seasonId, seasonId), gte(matches.createdAt, date)),
  });

  return getMatchesWithPlayers(result, db);
};

export const getMatchesBeforeDate = async (
  seasonId: number,
  date: Date,
  db?: CrokDbQueryable,
): Promise<Match[]> => {
  const database = db ?? readDb;
  const result = await database.query.matches.findMany({
    where: and(eq(matches.seasonId, seasonId), lte(matches.createdAt, date)),
  });

  return getMatchesWithPlayers(result, db);
};

export const getMatchesWithPlayers = async (
  result: DbMatch[],
  db?: CrokDbQueryable,
): Promise<Match[]> => {
  const database = db ?? readDb;
  const userIds = result
    .flatMap((match) => [
      match.blackPlayerOne,
      match.blackPlayerTwo,
      match.whitePlayerOne,
      match.whitePlayerTwo,
    ])
    .filter(notEmpty)
    .filter(unique);

  const players =
    userIds.length === 0
      ? []
      : await database.query.userTbl.findMany({
          where: inArray(userTbl.id, userIds),
          columns: {
            email: false,
            picture: false,
          },
        });

  return result.map((match) => {
    const blackPlayerOne = players.find(
      (player) => player.id === match.blackPlayerOne,
    )!;
    const blackPlayerTwo =
      players.find((player) => player.id === match.blackPlayerTwo) || null;
    const whitePlayerOne = players.find(
      (player) => player.id === match.whitePlayerOne,
    )!;
    const whitePlayerTwo =
      players.find((player) => player.id === match.whitePlayerTwo) || null;
    return {
      ...match,
      blackPlayerOne,
      blackPlayerTwo,
      whitePlayerOne,
      whitePlayerTwo,
    };
  });
};

export const getMatch = async (matchId: number): Promise<Match | undefined> => {
  const match = await readDb.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) return;

  const matchWithPlayers = await getMatchesWithPlayers([match]);
  return matchWithPlayers[0];
};

export const deleteMatch = async (matchId: number) => {
  const deletedMatch = await readDb
    .delete(matches)
    .where(eq(matches.id, matchId))
    .returning();
  return deletedMatch;
};
