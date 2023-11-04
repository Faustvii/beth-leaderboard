import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { torunamentTbl, tournamentTeamTbl } from "..";

export const tournamentMatchTbl = sqliteTable(
  "tournament_matches",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id", { mode: "number" }).references(
      () => torunamentTbl.id,
    ),
    team1: text("team_one")
      .notNull()
      .references(() => tournamentTeamTbl.id),
    team2: text("team_two")
      .notNull()
      .references(() => tournamentTeamTbl.id),
    result: text("result", { enum: ["Win", "Loss"] }).notNull(),
    round: integer("round", { mode: "number" }).notNull(),
    matchNumber: integer("match", { mode: "number" }).notNull(),
    bracket: text("bracket", { enum: ["Upper", "Lower"] }).notNull(),
    scoreDiff: integer("score_diff", { mode: "number" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("tournament_match_created_at_idx").on(
        table.createdAt,
      ),
    };
  },
);

export const tournamentMatchRelations = relations(
  tournamentMatchTbl,
  ({ one }) => ({
    team1: one(tournamentTeamTbl, {
      relationName: "team1",
      fields: [tournamentMatchTbl.team1],
      references: [tournamentTeamTbl.id],
    }),
    team2: one(tournamentTeamTbl, {
      relationName: "team2",
      fields: [tournamentMatchTbl.team2],
      references: [tournamentTeamTbl.id],
    }),
    tournament: one(torunamentTbl, {
      relationName: "tournament",
      fields: [tournamentMatchTbl.tournamentId],
      references: [torunamentTbl.id],
    }),
  }),
);

export type TournamentMatch = typeof tournamentMatchTbl.$inferSelect;
export type InsertTournamentMatch = typeof tournamentMatchTbl.$inferInsert;
