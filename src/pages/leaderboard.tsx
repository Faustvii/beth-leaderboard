import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { ctx } from "../context";
import { user } from "../db/schema";

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/page/:page", async ({ db, html, params: { page } }) => {
    const pageNumber = parseInt(page);
    const now = performance.now();
    const players = await db.query.user.findMany({
      orderBy: [desc(user.elo)],
      limit: 10,
      offset: (pageNumber - 1) * 10,
    });
    console.log(`retrieved players in ${performance.now() - now}ms`);
    const rows = players.map((player, index) => ({
      rank: index + (pageNumber - 1) * 10 + 1,
      name: player.name,
      elo: player.elo,
    }));
    return html(() => (
      <>
        {rows.map((row, index) => (
          <LeaderboardRowHtml
            {...row}
            last={index === rows.length - 1}
            page={pageNumber}
          />
        ))}
      </>
    ));
  });
