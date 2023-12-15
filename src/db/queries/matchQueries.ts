import { and, desc, eq, inArray, isNotNull, or, sql, sum } from "drizzle-orm";
import { unionAll } from "drizzle-orm/sqlite-core";
import { readDb } from "..";
import { notEmpty, unique } from "../../lib";
import { matches, userTbl } from "../schema";

export const getMatchesWithPlayers = async (userId?: string) => {
  const result = await readDb.query.matches.findMany({
    where: userId
      ? or(
          eq(matches.blackPlayerOne, userId),
          eq(matches.blackPlayerTwo, userId),
          eq(matches.whitePlayerOne, userId),
          eq(matches.whitePlayerTwo, userId),
        )
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

const eloChangeSubquery = (seasonId: number) => {
  const blackPlayerOneEloChanges = readDb
    .select({
      player_id: matches.blackPlayerOne,
      elo_change: matches.blackEloChange,
    })
    .from(matches)
    .where(
      and(isNotNull(matches.blackPlayerOne), eq(matches.seasonId, seasonId)),
    );
  const blackPlayerTwoEloChanges = readDb
    .select({
      player_id: sql<string>`${matches.blackPlayerTwo}`,
      elo_change: matches.blackEloChange,
    })
    .from(matches)
    .where(
      and(isNotNull(matches.blackPlayerTwo), eq(matches.seasonId, seasonId)),
    );
  const whitePlayerOneEloChanges = readDb
    .select({
      player_id: matches.whitePlayerOne,
      elo_change: matches.whiteEloChange,
    })
    .from(matches)
    .where(
      and(isNotNull(matches.whitePlayerOne), eq(matches.seasonId, seasonId)),
    );
  const whitePlayerTwoEloChanges = readDb
    .select({
      player_id: sql<string>`${matches.whitePlayerTwo}`,
      elo_change: matches.whiteEloChange,
    })
    .from(matches)
    .where(
      and(isNotNull(matches.whitePlayerTwo), eq(matches.seasonId, seasonId)),
    );
  const eloChanges = readDb
    .$with("eloChanges")
    .as(
      unionAll(
        blackPlayerOneEloChanges,
        blackPlayerTwoEloChanges,
        whitePlayerOneEloChanges,
        whitePlayerTwoEloChanges,
      ),
    );
  const result = readDb.$with("eloView").as(
    readDb
      .with(eloChanges)
      .select({
        player_id: eloChanges.player_id,
        total_elo_change: sum(eloChanges.elo_change)
          .mapWith(Number)
          .as("total_elo_change"),
      })
      .from(eloChanges)
      .groupBy(eloChanges.player_id),
  );
  return result;
};

export const playerEloQuery = async (userId: string, seasonId: number) => {
  const result = eloChangeSubquery(seasonId);
  const playerElo = await readDb
    .with(result)
    .select()
    .from(result)
    .where(eq(result.player_id, userId))
    .limit(1);
  if (playerElo.length === 0) return 1500;
  return (playerElo[0]?.total_elo_change ?? 0) + 1500;
};

export const playersEloQuery = async (userIds: string[], seasonId: number) => {
  const result = eloChangeSubquery(seasonId);
  const playerElo = await readDb
    .with(result)
    .select()
    .from(result)
    .where(inArray(result.player_id, userIds));
  return playerElo.map((elo) => ({
    id: elo.player_id,
    elo: (elo.total_elo_change ?? 0) + 1500,
  }));
};

export const getAllPlayersWithElo = async (seasonId: number) => {
  const result = eloChangeSubquery(seasonId);
  const playerElo = await readDb.with(result).select().from(result);
  return playerElo.map((elo) => ({
    id: elo.player_id,
    elo: (elo.total_elo_change ?? 0) + 1500,
  }));
};

export const playerEloPaginationQuery = async (
  page: number,
  seasonId: number,
) => {
  const pageSize = 15;
  const result = eloChangeSubquery(seasonId);
  const pageResult = readDb.$with("pageResult").as(
    readDb
      .with(result)
      .select()
      .from(result)
      .orderBy(desc(result.total_elo_change))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  );

  const playerEloChanges = await readDb
    .with(pageResult)
    .select({
      id: pageResult.player_id,
      name: userTbl.name,
      eloChange: pageResult.total_elo_change,
    })
    .from(pageResult)
    .innerJoin(userTbl, eq(pageResult.player_id, userTbl.id));

  return playerEloChanges.map((elo) => ({
    id: elo.id,
    name: elo.name,
    elo: (elo.eloChange ?? 0) + 1500,
  }));
};
