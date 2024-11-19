import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { SelectGet } from "../components/SelectGet";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import {
  getActiveSeason,
  getSeason,
  getSeasons,
} from "../db/queries/seasonQueries";
import { isHxRequest } from "../lib";
import MatchStatistics, { type RESULT } from "../lib/matchStatistics";
import { getRatings, getRatingSystem } from "../lib/rating";

const playerQuery = async (seasonId: number) => {
  const season = await getSeason(seasonId);
  const ratingSystem = getRatingSystem(season?.ratingSystem ?? "elo");

  const matches = await getMatches(seasonId);
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
    const activeSeason = await getActiveSeason();
    const activeSeasonId = activeSeason?.id ?? 1;
    return html(() => LeaderboardPage(session, headers, activeSeasonId));
  })
  .get("/:seasonId", async ({ html, session, headers, params }) => {
    const seasonId = parseInt(params.seasonId, 10);
    return html(() => LeaderboardPage(session, headers, seasonId));
  });

export async function LeaderboardPage(
  session: Session | null,
  headers: Record<string, string | null>,
  seasonId: number,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        LeaderboardTable(session, seasonId)
      ) : (
        <LayoutHtml>{LeaderboardTable(session, seasonId)}</LayoutHtml>
      )}
    </>
  );
}

async function LeaderboardTable(
  session: Session | null,
  seasonId: number,
): Promise<JSX.Element> {
  const rows = await playerQuery(seasonId);
  const seasons = await getSeasons();

  return (
    <>
      <NavbarHtml session={session} activePage="leaderboard" />
      <div class="flex flex-row justify-between">
        <HeaderHtml title="Leaderboard" />
        <div class="p-5">
          <SelectGet
            options={seasons.map((season) => ({
              path: `/leaderboard/${season.id}`,
              text: season.name,
            }))}
            selectedIndex={seasons.findIndex(
              (season) => season.id === seasonId,
            )}
          ></SelectGet>
        </div>
      </div>
      <LeaderboardTableHtml rows={rows}></LeaderboardTableHtml>
    </>
  );
}
