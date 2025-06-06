import { and, between, eq, gte, inArray, lte } from "drizzle-orm";
import { readDb, type CrokDbQueryable } from "..";
import { notEmpty, unique } from "../../lib";
import { shortName } from "../../lib/nameUtils";
import { type Match } from "../../lib/ratings/rating";
import { matches, userTbl } from "../schema";
import { type Match as DbMatch } from "../schema/matches";

export const getMatches = async (
  season: {
    startAt: Date;
    endAt: Date;
  },
  isAuthenticated: boolean,
): Promise<Match[]> => {
  const result = await readDb.query.matches.findMany({
    where: between(matches.createdAt, season.startAt, season.endAt),
  });

  return getMatchesWithPlayers(result, isAuthenticated);
};

export const getMatchesAfterDate = async (
  seasonId: number,
  date: Date,
  isAuthenticated: boolean,
  db?: CrokDbQueryable,
): Promise<Match[]> => {
  const database = db ?? readDb;
  const result = await database.query.matches.findMany({
    where: and(eq(matches.seasonId, seasonId), gte(matches.createdAt, date)),
  });

  return getMatchesWithPlayers(result, isAuthenticated, db);
};

export const getMatchesBeforeDate = async (
  seasonId: number,
  date: Date,
  isAuthenticated: boolean,
  db?: CrokDbQueryable,
): Promise<Match[]> => {
  const database = db ?? readDb;
  const result = await database.query.matches.findMany({
    where: and(eq(matches.seasonId, seasonId), lte(matches.createdAt, date)),
  });

  return getMatchesWithPlayers(result, isAuthenticated, db);
};

const getMatchesWithPlayers = async (
  result: DbMatch[],
  isAuthenticated: boolean,
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

  if (!isAuthenticated) {
    players.forEach((player) => {
      player.name = player.nickname;
    });
  } else {
    players.forEach((player) => {
      player.name = `${player.nickname} (${shortName(player.name)})`;
    });
  }

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

export const getMatch = async (
  matchId: number,
  isAuthenticated: boolean,
): Promise<Match | undefined> => {
  const match = await readDb.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) return;

  const matchWithPlayers = await getMatchesWithPlayers(
    [match],
    isAuthenticated,
  );
  return matchWithPlayers[0];
};

export const deleteMatch = async (matchId: number) => {
  const deletedMatch = await readDb
    .delete(matches)
    .where(eq(matches.id, matchId))
    .returning();
  return deletedMatch;
};
