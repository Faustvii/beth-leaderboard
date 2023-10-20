import { eq, inArray, or } from "drizzle-orm";
import { readDb } from "..";
import { notEmpty, unique } from "../../lib";
import { matches, user } from "../schema";

export const getMatchesWithPlayers = (userId?: string) =>
  readDb.query.matches.findMany({
    where: userId
      ? or(
          eq(matches.blackPlayerOne, userId),
          eq(matches.blackPlayerTwo, userId),
          eq(matches.whitePlayerOne, userId),
          eq(matches.whitePlayerTwo, userId),
        )
      : undefined,
    with: {
      blackPlayerOne: {
        columns: {
          id: true,
          name: true,
          elo: true,
        },
      },
      blackPlayerTwo: {
        columns: {
          id: true,
          name: true,
          elo: true,
        },
      },
      whitePlayerOne: {
        columns: {
          id: true,
          name: true,
          elo: true,
        },
      },
      whitePlayerTwo: {
        columns: {
          id: true,
          name: true,
          elo: true,
        },
      },
    },
  });

export const getMatchesWithPlayersHighPerformance = async (userId?: string) => {
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
      : await readDb.query.user.findMany({
          where: inArray(user.id, userIds),
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
