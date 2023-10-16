import { eq, or } from "drizzle-orm";
import { readDb } from "..";
import { matches } from "../schema";

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
