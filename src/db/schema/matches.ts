import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTbl } from ".";
import { seasonsTbl } from "./season";

export const matches = sqliteTable(
  "match",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    whitePlayerOne: text("white_player_one")
      .notNull()
      .references(() => userTbl.id),
    whitePlayerTwo: text("white_player_two").references(() => userTbl.id),
    blackPlayerOne: text("black_player_one")
      .notNull()
      .references(() => userTbl.id),
    blackPlayerTwo: text("black_player_two").references(() => userTbl.id),
    result: text("result", { enum: ["Black", "White", "Draw"] }).notNull(),
    scoreDiff: integer("score_diff", { mode: "number" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    seasonId: integer("seasonId")
      .notNull()
      .references(() => seasonsTbl.id),
  },
  (table) => {
    return {
      createdAtIdx: index("created_at_idx").on(table.createdAt),
      seasonsIdx: index("match_seasons_idx").on(table.seasonId),
      playersIdx: index("players_idx").on(
        table.blackPlayerOne,
        table.whitePlayerOne,
        table.blackPlayerTwo,
        table.whitePlayerTwo,
      ),
    };
  },
);

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
