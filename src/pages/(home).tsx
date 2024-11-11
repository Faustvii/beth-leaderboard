import { Elysia } from "elysia";
import { ctx } from "../context";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { LeaderboardPage } from "./leaderboard";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ headers, html, session }) => {
    const activeSeason = await getActiveSeason();
    const activeSeasonId = activeSeason?.id ?? 1;
    return html(() => LeaderboardPage(session, headers, activeSeasonId));
  });
