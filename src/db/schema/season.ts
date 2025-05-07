import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const seasonsTbl = sqliteTable(
  "season",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    startAt: integer("startAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    endAt: integer("endAt", { mode: "timestamp" }).notNull(),
    ratingSystem: text("ratingSystem", {
      enum: ["elo", "openskill", "xp", "scoreDiff"],
    })
      .notNull()
      .default("elo"),
    ratingEventSystem: text("ratingEventSystem", {
      enum: ["none", "quest"],
    })
      .notNull()
      .default("none"),
  },
  (table) => {
    return {
      seasonPeriodIdx: uniqueIndex("season_period_idx").on(
        table.startAt,
        table.endAt,
      ),
    };
  },
);

export type Season = typeof seasonsTbl.$inferSelect;
export type RatingSystemType = typeof seasonsTbl.$inferSelect.ratingSystem;
export type InsertSeason = typeof seasonsTbl.$inferInsert;
