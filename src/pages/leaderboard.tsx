import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { isHxRequest } from "../lib";
import MatchStatistics, { type RESULT } from "../lib/matchStatistics";
import { elo, getRatings } from "../lib/rating";

const playerPaginationQuery = async (page: number) => {
  const pageSize = 15;
  const activeSeason = await getActiveSeason();
  const activeSeasonId = activeSeason?.id ?? 1;

  const matches = await getMatches(activeSeasonId);
  const eloRatingSystem = elo();
  const players = getRatings(matches, eloRatingSystem);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;
  const playersInPage = players.slice(startIndex, endIndex);

  const lastPlayed = MatchStatistics.latestMatch(matches);
  const latestResults: Record<
    string,
    {
      winStreak: number;
      loseStreak: number;
      results: RESULT[];
    }
  > = MatchStatistics.currentStreaksByPlayer(matches);

  return playersInPage.map((player, index) => ({
    userId: player.player.id,
    rank: index + (page - 1) * pageSize + 1,
    name: player.player.name,
    elo: eloRatingSystem.toNumber(player.rating),
    lastPlayed:
      lastPlayed.find((match) => match.player.id === player.player.id)
        ?.lastPlayed || new Date(0),
    latestPlayerResults: latestResults[player.player.id]
      ? latestResults[player.player.id]
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
    lastPlayed: Date;
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
