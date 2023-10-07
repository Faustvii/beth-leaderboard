import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { user } from "../db/schema";

export const home = new Elysia()
  .use(ctx)
  .get("/", async ({ readDb, html, session }) => {
    const pageSize = 15;
    const players = await readDb.query.user.findMany({
      orderBy: [desc(user.elo)],
      limit: pageSize,
    });
    const rows = players.map((player, index) => ({
      rank: index + 1,
      name: player.name,
      elo: player.elo,
    }));
    return html(() => (
      <LayoutHtml>
        <NavbarHtml session={session} activePage="leaderboard" />
        <HeaderHtml title="Leaderboard" />
        <LeaderboardTableHtml page={1} rows={rows}></LeaderboardTableHtml>
      </LayoutHtml>
    ));
  });
