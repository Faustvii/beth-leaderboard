import { Elysia } from "elysia";
import { ctx } from "../context";
import { LeaderboardPage } from "./leaderboard";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ headers, html, session }) => {
    return html(() => LeaderboardPage(session, headers));
  });
