import { and, eq, gte, inArray } from "drizzle-orm";
import { readDb } from "..";
import { notEmpty, unique } from "../../lib";
import { type Match } from "../../lib/rating";
import { matches, userTbl } from "../schema";

export const getMatches = async (seasonId: number): Promise<Match[]> => {
  const result = await readDb.query.matches.findMany({
    where: eq(matches.seasonId, seasonId),
  });

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
      : await readDb.query.userTbl.findMany({
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

export const getMatchesGreaterThanEqual = async (
  seasonId: number,
  oldestDate: Date,
): Promise<Match[]> => {
  const result = await readDb.query.matches.findMany({
    where: and(
      eq(matches.seasonId, seasonId),
      gte(matches.createdAt, oldestDate),
    ),
  });

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
      : await readDb.query.userTbl.findMany({
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

  const userIds = [
    match.blackPlayerOne,
    match.blackPlayerTwo,
    match.whitePlayerOne,
    match.whitePlayerTwo,
  ]
    .filter(notEmpty)
    .filter(unique);

  const players =
    userIds.length === 0
      ? []
      : await readDb.query.userTbl.findMany({
          where: inArray(userTbl.id, userIds),
          columns: {
            email: false,
            picture: false,
          },
        });

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
};

export const deleteMatch = async (matchId: number) => {
  const deletedMatch = await readDb
    .delete(matches)
    .where(eq(matches.id, matchId))
    .returning();
  return deletedMatch;
};
