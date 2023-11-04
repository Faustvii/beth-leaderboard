import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { user } from ".";

export const tournamentMatchTbl = sqliteTable(
  "tournament_matches",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id", { mode: "number" }).references(
      () => torunamentTbl.id,
    ),
    team1: text("team_one")
      .notNull()
      .references(() => user.id),
    team2: text("team_two").references(() => user.id),
    result: text("result", { enum: ["Team1", "Team2"] }).notNull(),
    scoreDiff: integer("score_diff", { mode: "number" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("created_at_idx").on(table.createdAt),
    };
  },
);

export const torunamentTbl = sqliteTable(
  "tournaments",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    active: integer("active", { mode: "boolean" }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("created_at_idx").on(table.createdAt),
    };
  },
);

export const tournamentRelations = relations(torunamentTbl, ({ many }) => ({
  matches: many(tournamentMatchTbl),
  teams: many(tournamentTeamTbl),
}));

export const tournamentTeamTbl = sqliteTable(
  "tournament_teams",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id", { mode: "number" }).references(
      () => torunamentTbl.id,
    ),
    teamName: text("team_name").notNull(),
    teamElo: integer("team_elo", { mode: "number" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAtIdx: index("created_at_idx").on(table.createdAt),
    };
  },
);

export const tournamentTeamRelations = relations(
  tournamentTeamTbl,
  ({ many }) => ({
    members: many(tournamentTeamMemberTbl),
  }),
);

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
