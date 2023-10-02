import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { ctx } from "../context";
import { type readDb } from "../db";
import { user } from "../db/schema";

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/page/:page", ({ readDb, html, params: { page } }) =>
    html(PagedLeaderboard(page, readDb)),
  );

export async function PagedLeaderboard(page: string, db: typeof readDb) {
  const pageNumber = parseInt(page);
  const pageSize = 15;
  const players = await db.query.user.findMany({
    orderBy: [desc(user.elo)],
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
  });

  const rows = players.map((player, index) => ({
    rank: index + (pageNumber - 1) * pageSize + 1,
    name: player.name,
    elo: player.elo,
  }));

  return (
    <>
      {rows.map((row, index) => (
        <LeaderboardRowHtml {...row} first={index === 0} page={pageNumber} />
      ))}
    </>
  );
}
