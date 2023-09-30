import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const matches = sqliteTable(
  "match",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    whitePlayerOne: text("white_player_one").notNull(),
    whitePlayerTwo: text("white_player_two"),
    blackPlayerOne: text("black_player_one").notNull(),
    blackPlayerTwo: text("black_player_two"),
    result: text("content", { enum: ["black", "white", "draw"] }).notNull(),
    scoreDiff: integer("score_diff", { mode: "number" }).notNull(),
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
