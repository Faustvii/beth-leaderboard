import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { readDb } from "../db";
import { user } from "../db/schema";
import { isHxRequest } from "../lib";

export const playerPaginationQuery = async (page: number) => {
  const pageSize = 15;
  const players = await readDb.query.user.findMany({
    orderBy: [desc(user.elo)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return players.map((player, index) => ({
    rank: index + (page - 1) * pageSize + 1,
    name: player.name,
    elo: player.elo,
    picture: player.picture,
  }));
};

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => LeaderboardPage(session, headers));
  })
  .get("/page/:page", ({ html, params: { page } }) =>
    html(PagedLeaderboard(page)),
  );

export async function LeaderboardPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  const rows = await playerPaginationQuery(1);
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

export async function PagedLeaderboard(page: string) {
  const pageNumber = parseInt(page);
  const rows = await playerPaginationQuery(pageNumber);

  return (
    <>
      {rows.map((row, index) => (
        <LeaderboardRowHtml {...row} first={index === 0} page={pageNumber} />
      ))}
    </>
  );
}
