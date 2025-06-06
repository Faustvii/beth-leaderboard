import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const allTimeSeason: Season = {
  id: 0,
  name: "All Time",
  startAt: new Date(0), // 1970-01-01
  endAt: new Date(32503676400000), // 3000-01-01
  ratingSystem: "openskill",
  ratingEventSystem: "none",
};

export const ratingSystemTypes = [
  "elo",
  "openskill",
  "xp",
  "scoreDiff",
] as const;

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
      enum: ratingSystemTypes,
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
