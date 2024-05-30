import { blob, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTbl = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  picture: text("picture")
    .notNull()
    .$defaultFn(() => "/static/crokinole.svg"),
  roles: text("roles"),
});

export const session = sqliteTable("user_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTbl.id),
  activeExpires: blob("active_expires", {
    mode: "bigint",
  }).notNull(),
  idleExpires: blob("idle_expires", {
    mode: "bigint",
  }).notNull(),
});

export const key = sqliteTable("user_key", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTbl.id),
  hashedPassword: text("hashed_password"),
});

export type User = typeof userTbl.$inferSelect;
