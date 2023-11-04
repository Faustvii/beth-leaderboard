import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { tournamentTeamTbl, user } from "..";

export const tournamentTeamMemberTbl = sqliteTable(
  "tournament_team_members",
  {
    userId: text("user_id").references(() => user.id),
    teamId: integer("team_id", { mode: "number" }).references(
      () => tournamentTeamTbl.id,
    ),
  },
  (table) => ({
    pk: primaryKey(table.userId, table.teamId),
  }),
);

export const tournamentTeamMemberRelations = relations(
  tournamentTeamMemberTbl,
  ({ one }) => ({
    user: one(user, {
      relationName: "user",
      fields: [tournamentTeamMemberTbl.userId],
      references: [user.id],
    }),
    team: one(tournamentTeamTbl, {
      relationName: "team",
      fields: [tournamentTeamMemberTbl.teamId],
      references: [tournamentTeamTbl.id],
    }),
  }),
);

export type TournamentTeamMember = typeof tournamentTeamMemberTbl.$inferSelect;
export type InsertTournamentTeamMember =
  typeof tournamentTeamMemberTbl.$inferInsert;
