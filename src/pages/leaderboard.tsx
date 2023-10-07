import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { type readDb } from "../db";
import { user } from "../db/schema";
import { isHxRequest } from "../lib";

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/", async ({ readDb, html, session, headers }) => {
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
    return html(() => LeaderboardPage(session, headers, rows));
  })
  .get("/page/:page", ({ readDb, html, params: { page } }) =>
    html(PagedLeaderboard(page, readDb)),
  );

async function LeaderboardPage(
  session: Session | null,
  headers: Record<string, string | null>,
  rows: { rank: number; name: string; elo: number }[],
) {
  return (
    <>
      {isHxRequest(headers) ? (
        LeaderboardTable(session, rows)
      ) : (
        <LayoutHtml>{LeaderboardTable(session, rows)}</LayoutHtml>
      )}
    </>
  );
}

function LeaderboardTable(
  session: Session | null,
  rows: { rank: number; name: string; elo: number }[],
): JSX.Element {
  return (
    <>
      <NavbarHtml session={session} activePage="leaderboard" />
      <HeaderHtml title="Leaderboard" />
      <LeaderboardTableHtml page={1} rows={rows}></LeaderboardTableHtml>
    </>
  );
}

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
