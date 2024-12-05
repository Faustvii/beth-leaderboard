import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTbl } from "./auth";

export const questTbl = sqliteTable(
  "quest",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    playerId: text("playerId")
      .notNull()
      .references(() => userTbl.id),
    conditionData: text("conditionData", { mode: "json" }).notNull(),
    type: text("type").notNull(),
    description: text("type").notNull(),
  },
  (table) => {
    return {
      playerIdIdx: index("quest_player_id_idx").on(table.playerId),
    };
  },
);

export type Quest = typeof questTbl.$inferSelect;
export type InsertQuest = typeof questTbl.$inferInsert;
