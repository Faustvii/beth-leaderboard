import { and, eq, inArray, or } from "drizzle-orm";
import { readDb } from "..";
import { notEmpty, unique } from "../../lib";
import { elo, getRatings, type Match } from "../../lib/rating";
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

export const getMatchesWithPlayers = async (
  seasonId?: number,
  userId?: string,
) => {
  const result = await readDb.query.matches.findMany({
    where:
      userId && seasonId
        ? and(
            eq(matches.seasonId, seasonId),
            or(
              eq(matches.blackPlayerOne, userId),
              eq(matches.blackPlayerTwo, userId),
              eq(matches.whitePlayerOne, userId),
              eq(matches.whitePlayerTwo, userId),
            ),
          )
        : seasonId
          ? eq(matches.seasonId, seasonId)
          : undefined,
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

export const playerEloPaginationQuery = async (
  page: number,
  seasonId: number,
) => {
  const pageSize = 15;

  const matches = await getMatches(seasonId);
  const eloRatingSystem = elo();
  const eloRatings = getRatings(matches, eloRatingSystem);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;

  return eloRatings.slice(startIndex, endIndex).map((x) => ({
    id: x.player.id,
    name: x.player.name,
    elo: x.rating,
  }));
};
