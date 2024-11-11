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
import { getRatings, getRatingSystem } from "../lib/rating";

const playerQuery = async () => {
  const activeSeason = await getActiveSeason();
  const activeSeasonId = activeSeason?.id ?? 1;
  const activeSeasonRatingSystemType = activeSeason?.ratingSystem ?? "elo";

  const matches = await getMatches(activeSeasonId);
  const ratingSystem = getRatingSystem(activeSeasonRatingSystemType);
  const players = getRatings(matches, ratingSystem);


  const lastPlayed = MatchStatistics.latestMatch(matches);
  const latestResults: Record<
    string,
    {
      winStreak: number;
      loseStreak: number;
      results: RESULT[];
    }
  > = MatchStatistics.currentStreaksByPlayer(matches);

  return players.map((player, index) => ({
    userId: player.player.id,
    rank: index + 1,
    name: player.player.name,
    rating: ratingSystem.toNumber(player.rating),
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

export async function LeaderboardPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  const rows = await playerQuery();
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
    rating: number;
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
      <LeaderboardTableHtml rows={rows}></LeaderboardTableHtml>
    </>
  );
}

export async function PagedLeaderboard(seasonId: number) {
  const rows = await playerQuery(seasonId);

  return (
    <>
      {rows.map((row) => (
        <LeaderboardRowHtml {...row} />
      ))}
    </>
  );
}
