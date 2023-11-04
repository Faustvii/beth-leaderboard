import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { torunamentTbl, tournamentTeamMemberTbl } from "..";

export const tournamentTeamTbl = sqliteTable(
  "tournament_teams",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id", { mode: "number" }).references(
      () => torunamentTbl.id,
    ),
    teamName: text("team_name").notNull(),
    teamElo: integer("team_elo", { mode: "number" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("tournament_teams_created_at_idx").on(
        table.createdAt,
      ),
    };
  },
);

export const tournamentTeamRelations = relations(
  tournamentTeamTbl,
  ({ many, one }) => ({
    members: many(tournamentTeamMemberTbl),
    tournament: one(torunamentTbl, {
      relationName: "tournament",
      fields: [tournamentTeamTbl.tournamentId],
      references: [torunamentTbl.id],
    }),
  }),
);

export type TournamentTeam = typeof tournamentTeamTbl.$inferSelect;
export type InsertTournamentTeam = typeof tournamentTeamTbl.$inferInsert;
