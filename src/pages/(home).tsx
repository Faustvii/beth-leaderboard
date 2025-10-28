import { Elysia } from "elysia";
import { ctx } from "../context";
import { type TimeInterval } from "../lib/ratings/rating";
import { LeaderboardPage } from "./leaderboard";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ html, headers, session, season, ratingSystem, query }) => {
    const timeInterval = query.interval as TimeInterval | undefined;
    return html(() =>
      LeaderboardPage(session, headers, season, ratingSystem, timeInterval),
    );
  });
