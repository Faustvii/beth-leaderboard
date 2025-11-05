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
    active: integer("active", { mode: "boolean" }).notNull().default(true), // Whether webhook is active
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()), // Creation timestamp
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()), // Last updated timestamp
  },
  (table) => {
    return {
      urlEventTypeIdx: uniqueIndex("url_event_type_idx").on(table.url, table.eventType),
    };
  },
);

export type Webhook = typeof webhookTbl.$inferSelect;
export type InsertWebhook = typeof webhookTbl.$inferInsert;
export type WebhookEventType = typeof webhookTbl.$inferInsert.eventType;