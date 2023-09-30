import { relations } from "drizzle-orm";
import { user } from "./auth";
import { matches } from "./matches";

export { key, session, user } from "./auth";
export { matches } from "./matches";

export const userRelations = relations(user, ({ many }) => ({
  matches: many(matches),
}));

export const matchRelations = relations(matches, ({ one }) => ({
  blackPlayerOne: one(user, {
    fields: [matches.blackPlayerOne],
    references: [user.id],
  }),
  blackPlayerTwo: one(user, {
    fields: [matches.blackPlayerTwo],
    references: [user.id],
  }),
  whitePlayerOne: one(user, {
    fields: [matches.whitePlayerOne],
    references: [user.id],
  }),
  whitePlayerTwo: one(user, {
    fields: [matches.whitePlayerTwo],
    references: [user.id],
  }),
}));
