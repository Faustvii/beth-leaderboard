import { relations } from "drizzle-orm";
import { userTbl } from "./auth";
import { matches } from "./matches";
import { seasonsTbl } from "./season";

export { key, session, userTbl } from "./auth";
export { matches } from "./matches";
export { job_queue } from "./jobQueue";
export { seasonsTbl } from "./season";

export const matchPlayerRelations = relations(matches, ({ one }) => ({
  blackPlayerOne: one(userTbl, {
    relationName: "blackPlayerOne",
    fields: [matches.blackPlayerOne],
    references: [userTbl.id],
  }),
  blackPlayerTwo: one(userTbl, {
    relationName: "blackPlayerTwo",
    fields: [matches.blackPlayerTwo],
    references: [userTbl.id],
  }),
  whitePlayerOne: one(userTbl, {
    relationName: "whitePlayerOne",
    fields: [matches.whitePlayerOne],
    references: [userTbl.id],
  }),
  whitePlayerTwo: one(userTbl, {
    relationName: "whitePlayerTwo",
    fields: [matches.whitePlayerTwo],
    references: [userTbl.id],
  }),
}));

export const matchSeasonRelations = relations(matches, ({ one }) => ({
  season: one(seasonsTbl, {
    relationName: "season",
    fields: [matches.seasonId],
    references: [seasonsTbl.id],
  }),
}));
