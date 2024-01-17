import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const userTbl = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    picture: text("picture")
      .notNull()
      .$defaultFn(() => "/public/crokinole-c.min.svg"),
    elo: integer("elo").notNull().default(1500),
    // other user attributes
  },
  (table) => {
    return {
      eloIdx: index("elo_idx").on(table.elo),
    };
  },
);

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
