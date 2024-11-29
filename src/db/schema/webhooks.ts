import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const webhookTbl = sqliteTable(
  "webhooks",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    url: text("url").notNull(), // The URL where the webhook will be sent
    secret: text("secret"), // Optional secret for signing webhook payloads
    eventType: text("event_type", {
      enum: ["match", "season_end", "season_start"],
    }).notNull(), // Event type the subscriber is interested in
    createdAt: integer("created_at").notNull().default(Date.now()), // Creation timestamp
    updatedAt: integer("updated_at").notNull().default(Date.now()), // Last updated timestamp
  },
  (table) => {
    return {
      seasonPeriodIdx: uniqueIndex("url").on(table.url),
    };
  },
);

export type Webhook = typeof webhookTbl.$inferSelect;
export type InsertWebhook = typeof webhookTbl.$inferInsert;
export type WebookEventType = typeof webhookTbl.$inferInsert.eventType;
