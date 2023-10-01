import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { BaseHtml } from "../components/base";
import { HeaderHtml } from "../components/header";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { ctx } from "../context";
import { user } from "../db/schema";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ db, html, session }) => {
    const players = await db.query.user.findMany({
      orderBy: [desc(user.elo)],
      limit: 10,
    });
    const rows = players.map((player, index) => ({
      rank: index + 1,
      name: player.name,
      elo: player.elo,
    }));
    return html(() => (
      <BaseHtml session={session}>
        <HeaderHtml title="Leaderboard" />
        <LeaderboardTableHtml page={1} rows={rows}></LeaderboardTableHtml>
      </BaseHtml>
    ));
  });

function getRows(page: number) {
  const rows = [];
  if (page === 1) page = 0;
  page = page * 10;
  for (let i = 1; i <= 10; i++) {
    rows.push({ rank: i + page, name: `test${i}`, elo: 3000 - i });
  }
  return rows;
}
