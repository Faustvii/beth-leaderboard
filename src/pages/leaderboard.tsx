import { desc, inArray, or } from "drizzle-orm";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { readDb } from "../db";
import { matches, user } from "../db/schema";
import { isHxRequest } from "../lib";
import MatchStatistics, { type RESULT } from "../lib/matchStatistics";

export const playerPaginationQuery = async (page: number) => {
  const pageSize = 15;
  const players = await readDb.query.user.findMany({
    columns: {
      picture: false,
    },
    orderBy: [desc(user.elo)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const playerIds = players.map((player) => player.id);

  const matchesByPlayer = await readDb.query.matches.findMany({
    orderBy: [desc(matches.createdAt)],
    where: or(
      inArray(matches.blackPlayerOne, playerIds),
      inArray(matches.whitePlayerOne, playerIds),
      inArray(matches.blackPlayerTwo, playerIds),
      inArray(matches.whitePlayerTwo, playerIds),
    ),
  });

  const latestResults = MatchStatistics.currentStreaksByPlayer(matchesByPlayer);

  return players.map((player, index) => ({
    userId: player.id,
    rank: index + (page - 1) * pageSize + 1,
    name: player.name,
    elo: player.elo,
    latestPlayerResults: latestResults[player.id]
      ? latestResults[player.id]
      : null,
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
  rows: {
    userId: string;
    rank: number;
    name: string;
    elo: number;
    latestPlayerResults: {
      winStreak: number;
      loseStreak: number;
      results: RESULT[];
    } | null;
  }[],
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
