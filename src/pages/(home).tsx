import { Elysia } from "elysia";
import { LayoutHtml } from "../components/Layout";
import { ctx } from "../context";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { LeaderboardPage } from "./leaderboard";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ headers, html, session }) => {
    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
      return <LayoutHtml>No active season</LayoutHtml>;
    }
    return html(() =>
      LeaderboardPage(
        session,
        headers,
        activeSeason,
        activeSeason.ratingSystem,
      ),
    );
  });
