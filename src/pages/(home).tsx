import { Elysia } from "elysia";
import { ctx } from "../context";
import { parseTimeInterval } from "../lib/ratings/rating";
import { LeaderboardPage } from "./leaderboard";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ html, headers, session, season, ratingSystem, query }) => {
    const parsedTimeInterval = parseTimeInterval(
      query.interval as string | undefined,
    );
    return html(() =>
      LeaderboardPage(
        session,
        headers,
        season,
        ratingSystem,
        parsedTimeInterval,
      ),
    );
  });
