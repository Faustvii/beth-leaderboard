import { Html } from "@kitajs/html";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { LeaderboardTableHtml } from "../components/LeaderboardTable";
import { MainContainer } from "../components/MainContainer";
import { NavbarHtml } from "../components/Navbar";
import { TimeIntervalPicker } from "../components/TimeIntervalPicker";
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
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";
import { isDefined } from "../lib/utils";
import { SeasonPicker } from "./admin/components/SeasonPicker";

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
  let ratingChanges: Map<
    string,
    { ratingBefore?: number; rankBefore?: number }
  > = new Map();

  if (timeInterval) {
    const cutoffDate = getTimeIntervalCutoffDate(timeInterval);
    const diffs = getTimeIntervalRatingDiff(matches, cutoffDate, ratingSystem);

    ratingChanges = new Map(
      diffs.map((diff) => [
        diff.player.id,
        {
          ratingBefore: isDefined(diff.ratingBefore)
            ? ratingSystem.toNumber(diff.ratingBefore)
            : undefined,
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
      name: player.player.name,
      rating: ratingSystem.toNumber(player.rating),
      ratingBefore: changes?.ratingBefore,
      rankBefore: changes?.rankBefore,
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
    const timeInterval = query.interval as TimeInterval | undefined;
    return html(() =>
      LeaderboardPage(session, headers, season, ratingSystem, timeInterval),
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
        <MainContainer>
          {LeaderboardTable(session, season, ratingSystem, timeInterval)}
        </MainContainer>
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
      <div class="flex flex-row items-center justify-between gap-2">
        <HeaderHtml title="Leaderboard" />
        <div class="flex gap-2">
          <TimeIntervalPicker
            basePath="/leaderboard"
            currentInterval={timeInterval}
            season={season}
            ratingSystem={ratingSystem}
          />
          <SeasonPicker
            basePath="/leaderboard"
            season={season}
            ratingSystem={ratingSystem}
          />
        </div>
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
