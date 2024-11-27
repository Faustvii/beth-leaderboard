import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTbl } from "./auth";
import { seasonsTbl } from "./season";

export const ratingEventTbl = sqliteTable(
  "rating_event",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    seasonId: integer("seasonId")
      .notNull()
      .references(() => seasonsTbl.id),
    playerId: integer("playerId")
      .notNull()
      .references(() => userTbl.id),
    data: text("data", { mode: "json" }).notNull(),
    type: text("type").notNull(),
  },
  (table) => {
    return {
      seasonIdIdx: index("season_id_idx").on(table.seasonId),
      playerIdIdx: index("player_id_idx").on(table.playerId),
    };
  },
);

export type RatingEvent = typeof ratingEventTbl.$inferSelect;
export type RatingEventType = typeof ratingEventTbl.$inferSelect.type;
export type InsertRatingEvent = typeof ratingEventTbl.$inferInsert;
