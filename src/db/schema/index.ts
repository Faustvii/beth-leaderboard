import { relations } from "drizzle-orm";
import { user } from "./auth";
import { matches } from "./matches";

export {
  torunamentTbl,
  tournamentMatchTbl,
  tournamentTeamTbl,
  tournamentTeamMemberTbl,
  tournamentTeamMemberRelations,
  tournamentRelations,
  tournamentTeamRelations,
} from "./tournament";

export { key, session, user } from "./auth";
export { matches } from "./matches";
export { job_queue } from "./jobQueue";

export const matchRelations = relations(matches, ({ one }) => ({
  blackPlayerOne: one(user, {
    relationName: "blackPlayerOne",
    fields: [matches.blackPlayerOne],
    references: [user.id],
  }),
  blackPlayerTwo: one(user, {
    relationName: "blackPlayerTwo",
    fields: [matches.blackPlayerTwo],
    references: [user.id],
  }),
  whitePlayerOne: one(user, {
    relationName: "whitePlayerOne",
    fields: [matches.whitePlayerOne],
    references: [user.id],
  }),
  whitePlayerTwo: one(user, {
    relationName: "whitePlayerTwo",
    fields: [matches.whitePlayerTwo],
    references: [user.id],
  }),
}));
