import { Html } from "@kitajs/html";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getSeasons } from "../db/queries/seasonQueries";
import { type Season } from "../db/schema/season";
import { isHxRequest } from "../lib";
import MatchStatistics, { type RESULT } from "../lib/matchStatistics";
import {
  getRatings,
  type Rating,
  type RatingSystem,
} from "../lib/ratings/rating";
import { SeasonPicker } from "./admin/components/SeasonPicker";

const playerQuery = async (
  season: Season,
  ratingSystem: RatingSystem<Rating>,
  isAuthenticated: boolean,
) => {
  const matches = await getMatches(season, isAuthenticated);
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
  .get("/", async ({ html, session, headers, season, ratingSystem }) => {
    return html(() => LeaderboardPage(session, headers, season, ratingSystem));
  });

export async function LeaderboardPage(
  session: Session | null,
  headers: Record<string, string | null>,
  season: Season,
  ratingSystem: RatingSystem<Rating>,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        LeaderboardTable(session, season, ratingSystem)
      ) : (
        <LayoutHtml>
          {LeaderboardTable(session, season, ratingSystem)}
        </LayoutHtml>
      )}
    </>
  );
}

async function LeaderboardTable(
  session: Session | null,
  season: Season,
  ratingSystem: RatingSystem<Rating>,
): Promise<JSX.Element> {
  const isAuthenticated = !!session?.user;
  const rows = await playerQuery(season, ratingSystem, isAuthenticated);
  const seasons = await getSeasons();

  return (
    <>
      <NavbarHtml session={session} activePage="leaderboard" />
      <div class="flex flex-row justify-between">
        <HeaderHtml title="Leaderboard" />
        <SeasonPicker
          basePath="/leaderboard"
          season={season}
          ratingSystem={ratingSystem}
        />
      </div>
      <LeaderboardTableHtml
        rows={rows}
        isCurrentSeason={isCurrentSeason(season.id, seasons)}
      ></LeaderboardTableHtml>
    </>
  );
}

function isCurrentSeason(seasonId: number, seasons: Season[]): boolean {
  const now = Date.now();
  const { id: currentSeasonId } = seasons.find(
    ({ startAt, endAt }) => now > startAt.getTime() && now < endAt.getTime(),
  ) ?? { id: -1 };
  return currentSeasonId == seasonId;
}
