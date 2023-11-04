import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tournamentMatchTbl, tournamentTeamTbl } from "..";

export const torunamentTbl = sqliteTable(
  "tournaments",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    active: integer("active", { mode: "boolean" }).notNull(),
    mode: text("mode", {
      enum: ["Single Elimination", "Double Elimination"],
    }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("tournament_created_at_idx").on(table.createdAt),
    };
  },
);

export const tournamentRelations = relations(torunamentTbl, ({ many }) => ({
  matches: many(tournamentMatchTbl),
  teams: many(tournamentTeamTbl),
}));

export type Tournament = typeof torunamentTbl.$inferSelect;
export type InsertTournament = typeof torunamentTbl.$inferInsert;
