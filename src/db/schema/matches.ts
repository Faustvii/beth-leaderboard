import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { user } from ".";

export const matches = sqliteTable(
  "match",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    whitePlayerOne: text("white_player_one")
      .notNull()
      .references(() => user.id),
    whitePlayerTwo: text("white_player_two").references(() => user.id),
    blackPlayerOne: text("black_player_one")
      .notNull()
      .references(() => user.id),
    blackPlayerTwo: text("black_player_two").references(() => user.id),
    result: text("content", { enum: ["Black", "White", "Draw"] }).notNull(),
    scoreDiff: integer("score_diff", { mode: "number" }).notNull(),
    eloChange: integer("elo_change", { mode: "number" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("created_at_idx").on(table.createdAt),
    };
  },
);
export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

export const insertTweetSchema = createInsertSchema(matches);
export const selectTweetSchema = createSelectSchema(matches);
