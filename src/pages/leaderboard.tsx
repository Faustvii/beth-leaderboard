import { Html } from "@kitajs/html";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { FilterBar } from "../components/FilterBar";
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
  getTimeIntervalCutoffDate,
  getTimeIntervalRatingDiff,
  parseTimeInterval,
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";

const playerQuery = async (
  season: Season,
  ratingSystem: RatingSystem<Rating>,
  isAuthenticated: boolean,
  timeInterval: TimeInterval | undefined,
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

  // Calculate rating/rank changes if time interval is specified
  let ratingChanges = new Map<
    string,
    { ratingBefore?: Rating; rankBefore?: number }
  >();

  if (timeInterval) {
    const cutoffDate = getTimeIntervalCutoffDate(timeInterval);
    const diffs = getTimeIntervalRatingDiff(matches, cutoffDate, ratingSystem);

    ratingChanges = new Map(
      diffs.map((diff) => [
        diff.player.id,
        {
          ratingBefore: diff.ratingBefore,
          rankBefore: diff.rankBefore,
        },
      ]),
    );
  }

  return players.map((player, index) => {
    const changes = ratingChanges.get(player.player.id);

    return {
      userId: player.player.id,
      rank: index + 1,
      rankBefore:
        changes?.rankBefore !== undefined ? changes.rankBefore + 1 : undefined,
      name: player.player.name,
      rating: ratingSystem.toNumber(player.rating),
      ratingBefore: changes?.ratingBefore
        ? ratingSystem.toNumber(changes.ratingBefore)
        : undefined,
      lastPlayed:
        lastPlayed.find((match) => match.player.id === player.player.id)
          ?.lastPlayed || new Date(0),
      latestPlayerResults: latestResults[player.player.id]
        ? latestResults[player.player.id]
        : null,
    };
  });
};

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/", async ({ html, session, headers, season, ratingSystem, query }) => {
    const parsedTimeInterval = parseTimeInterval(
      query.interval as string | undefined,
    );
    return html(() =>
      LeaderboardPage(
        session,
        headers,
        season,
        ratingSystem,
        parsedTimeInterval,
      ),
    );
  });

export async function LeaderboardPage(
  session: Session | null,
  headers: Record<string, string | null>,
  season: Season,
  ratingSystem: RatingSystem<Rating>,
  timeInterval: TimeInterval | undefined,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        LeaderboardTable(session, season, ratingSystem, timeInterval)
      ) : (
        <LayoutHtml>
          {LeaderboardTable(session, season, ratingSystem, timeInterval)}
        </LayoutHtml>
      )}
    </>
  );
}

async function LeaderboardTable(
  session: Session | null,
  season: Season,
  ratingSystem: RatingSystem<Rating>,
  timeInterval: TimeInterval | undefined,
): Promise<JSX.Element> {
  const isAuthenticated = !!session?.user;
  const rows = await playerQuery(
    season,
    ratingSystem,
    isAuthenticated,
    timeInterval,
  );
  const seasons = await getSeasons();

  return (
    <>
      <NavbarHtml session={session} activePage="leaderboard" />
      <div class="flex flex-row justify-between">
        <HeaderHtml title="Leaderboard" />
        <FilterBar
          basePath="/leaderboard"
          season={season}
          ratingSystem={ratingSystem}
          timeInterval={timeInterval}
        />
      </div>
      <LeaderboardTableHtml
        rows={rows}
        isCurrentSeason={isCurrentSeason(season.id, seasons)}
      />
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
