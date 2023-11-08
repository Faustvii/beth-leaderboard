import { eq } from "drizzle-orm";
import { readDb } from "../..";
import { torunamentTbl } from "../../schema";

export const getActiveTournament = async () =>
  await readDb.query.torunamentTbl.findFirst({
    where: eq(torunamentTbl.active, true),
    with: {
      matches: {
        columns: {
          team1: true,
          team2: true,
          result: true,
          bracket: true,
          round: true,
        },
      },
      teams: {
        columns: {
          teamName: true,
          teamElo: true,
        },
        with: {
          members: {
            with: {
              user: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
