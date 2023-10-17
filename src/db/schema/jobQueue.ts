import {
  index,
  int,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const job_queue = sqliteTable(
  "job_queue",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ["image"] }).notNull(),
    status: text("status", {
      enum: ["pending", "processing", "complete", "error"],
    }).notNull(),
    data: text("payload", { mode: "json" })
      .$type<{ userId: string }>()
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("jq_created_at_idx").on(table.createdAt),
      statusIdx: index("jq_status_idx").on(table.status),
      typeIdx: index("jq_type_idx").on(table.type),
    };
  },
);

export type JobQueue = typeof job_queue.$inferSelect;
export type InsertJobQueue = typeof job_queue.$inferInsert;
