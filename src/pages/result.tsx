import { type PropsWithChildren } from "@kitajs/html";
import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { HxButton } from "../components/HxButton";
import { LayoutHtml } from "../components/Layout";
import { MatchDescription } from "../components/MatchDescription";
import { NavbarHtml } from "../components/Navbar";
import { RatingSystemPicker } from "../components/RatingSystemPicker";
import { SeasonPicker } from "../components/SeasonPicker";
import { ctx } from "../context";
import { getMatch, getMatches } from "../db/queries/matchQueries";
import { getSeason } from "../db/queries/seasonQueries";
import {
  getMatchRatingDiff,
  type Match,
  type Rating,
  type RatingSystem,
} from "../lib/ratings/rating";
import { isDefined } from "../lib/utils";

export const matchResult = new Elysia({
  prefix: "/result",
})
  .use(ctx)
  .get("/:matchId", ({ html, params, session, query, ratingSystem }) => {
    // Cannot use "season" from context/middleware as we don't want the "current" season
    const seasonId = query.season ? parseInt(query.season, 10) : undefined;
    const matchId = parseInt(params.matchId, 10);
    return html(page(session, matchId, seasonId, ratingSystem));
  });

async function page(
  session: Session | null,
  matchId: number,
  seasonId: number | undefined,
  ratingSystem: RatingSystem<Rating>,
) {
  const match = await getMatch(matchId, !!session?.user);
  if (!match) {
    return <LayoutHtml>Match does not exist</LayoutHtml>;
  }

  const season = await getSeason(seasonId ?? match.seasonId);
  if (!season) {
    return <LayoutHtml>Season not found</LayoutHtml>;
  }

  return (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="result" />
      <div class="flex flex-row items-center justify-between">
        <HeaderHtml className="px-0" title="Match result" />
        <div class="flex flex-row items-center gap-2 p-5">
          <SeasonPicker
            basePath={`/result/${matchId}`}
            season={season}
            ratingSystem={ratingSystem}
          />
          <RatingSystemPicker
            basePath={`/result/${matchId}`}
            season={season}
            ratingSystem={ratingSystem}
          />
        </div>
      </div>
      <MatchDescription match={match} />
      <RatingDiff
        session={session}
        match={match}
        seasonId={seasonId ?? match.seasonId}
        ratingSystem={ratingSystem}
      />
    </LayoutHtml>
  );
}

async function RatingDiff({
  session,
  match,
  seasonId,
  ratingSystem,
}: {
  session: Session | null;
  match: Match;
  seasonId: number;
  ratingSystem: RatingSystem<Rating>;
}) {
  const season = await getSeason(seasonId);
  if (!season) {
    return <LayoutHtml>Season not found</LayoutHtml>;
  }

  const allMatchesInSeason = await getMatches(season, !!session?.user);

  if (!allMatchesInSeason.find((x) => x.id === match.id)) {
    return <LayoutHtml>Match not in season</LayoutHtml>;
  }

  const allMatchesInSeasonSorted = allMatchesInSeason.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const matches = allMatchesInSeasonSorted.slice(
    0,
    allMatchesInSeasonSorted.findIndex((x) => x.id === match.id) + 1,
  );

  const matchDiff = getMatchRatingDiff(matches, ratingSystem)
    .map((x) => ({
      playerId: x.player.id,
      playerName: x.player.name,
      ratingBefore: isDefined(x.ratingBefore)
        ? ratingSystem.toNumber(x.ratingBefore)
        : undefined,
      ratingAfter: ratingSystem.toNumber(x.ratingAfter),
      rankBefore: x.rankBefore,
      rankAfter: x.rankAfter,
    }))
    .toSorted((a, b) => a.rankAfter - b.rankAfter);

  return (
    <RatingDiffTable>
      {matchDiff.map((playerDiff) => (
        <RatingDiffTableRow {...playerDiff} />
      ))}
    </RatingDiffTable>
  );
}

function RatingDiffTable({ children }: PropsWithChildren): JSX.Element {
  return (
    <>
      <div class="flex flex-col items-center justify-center">
        <div class="w-full overflow-x-auto rounded-lg shadow-md">
          <table class="w-full text-left text-sm text-gray-400">
            <thead class="bg-gray-700 text-xs uppercase text-gray-400">
              <tr>
                <th scope="col" class="px-1 py-3 pl-2 md:px-3 lg:px-6">
                  Rank
                </th>
                <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
                  Name
                </th>
                <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function RatingDiffTableRow({
  playerId,
  playerName,
  ratingBefore,
  ratingAfter,
  rankBefore,
  rankAfter,
}: {
  playerId: string;
  playerName: string;
  ratingBefore: number | undefined;
  ratingAfter: number;
  rankBefore: number | undefined;
  rankAfter: number;
}): JSX.Element {
  return (
    <>
      <tr class="border-b border-gray-700 bg-gray-800">
        <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">
          <span class="inline-block	w-4">{rankAfter}.</span>
          <DiffIcon
            before={rankBefore}
            after={rankAfter}
            isHigherBetter={false}
          />
        </td>
        <th
          scope="row"
          class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-white md:flex md:px-3 lg:px-6"
        >
          <img
            class="col-span-2 mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
            src={`/static/user/${playerId}/small`}
            loading="lazy"
            alt=""
          />
          <div class="col-span-8 flex flex-col gap-0 text-left">
            <HxButton
              class="w-44 overflow-hidden truncate whitespace-nowrap text-left md:w-full"
              hx-get={`/profile/${playerId}`}
            >
              {playerName}
            </HxButton>
          </div>
        </th>
        <td class="px-1 py-4 md:px-3 lg:px-6">
          <span class="inline-block	w-8">{ratingAfter}</span>
          <DiffIcon
            before={ratingBefore}
            after={ratingAfter}
            isHigherBetter={true}
          />
        </td>
      </tr>
    </>
  );
}

function DiffIcon({
  before,
  after,
  isHigherBetter,
}: {
  before: number | undefined;
  after: number;
  isHigherBetter: boolean;
}): JSX.Element {
  const areDefined = isDefined(before) && after;
  const areEqual = before === after;
  const shouldDisplay = areDefined && !areEqual;

  if (!shouldDisplay) {
    return <></>;
  }

  const difference = after - before;
  const isPositive = difference > 0;
  const isImproved = isHigherBetter ? isPositive : !isPositive;

  return (
    <span class={["pl-1", isImproved ? "text-green-500" : "text-red-500"]}>
      {isImproved ? "▲" : "▼"}
      {Math.abs(difference)}
    </span>
  );
}
