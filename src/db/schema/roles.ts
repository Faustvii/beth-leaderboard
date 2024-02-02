import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { userTbl } from ".";

export const roleTbl = sqliteTable("roles", {
  role: text("role").primaryKey(),
  userid: text("id").primaryKey(),
});

export const rolesRelations = relations(roleTbl, ({ one }) => ({
  roles: one(userTbl, {
    relationName: "userid",
    fields: [roleTbl.userid],
    references: [userTbl.id],
  }),
}));
