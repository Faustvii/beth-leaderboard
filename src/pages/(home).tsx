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
    const pageSize = 15;
    const players = await db.query.user.findMany({
      orderBy: [desc(user.elo)],
      limit: pageSize,
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
