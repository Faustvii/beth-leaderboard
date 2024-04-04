import { and, desc, eq, inArray, isNotNull, or, sql, sum } from "drizzle-orm";
import { unionAll } from "drizzle-orm/sqlite-core";
import { readDb } from "..";
import { notEmpty, unique } from "../../lib";
import { elo, getRatings, Match } from "../../lib/rating";
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

export const playersEloQuery = async (userIds: string[], seasonId: number) => {
  const matches = await getMatches(seasonId);
  const eloRatingSystem = elo();
  const eloRatings = getRatings(matches, eloRatingSystem)
    .filter((x) => userIds.includes(x.player.id))
    .map((x) => ({
      id: x.player.id,
      elo: x.rating,
    }));

  // None of the players have played any matches
  if (eloRatings.length === 0) {
    return userIds.map((id) => ({
      id,
      elo: 1500,
    }));
  }
  // Some of the players haven't played any matches
  if (eloRatings.length !== userIds.length) {
    const missingIds = userIds.filter(
      (id) => !eloRatings.find((elo) => elo.id === id),
    );
    eloRatings.push(
      ...missingIds.map((id) => ({
        id: id,
        elo: eloRatingSystem.defaultRating,
      })),
    );
  }

  return eloRatings.map((elo) => ({
    id: elo.id,
    elo: elo.elo ?? eloRatingSystem.defaultRating,
  }));
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
