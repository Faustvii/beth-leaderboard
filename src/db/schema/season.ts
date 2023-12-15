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
export type InsertSeason = typeof seasonsTbl.$inferInsert;
