import { type PropsWithChildren } from "@kitajs/html";
import Elysia from "elysia";
import { type Session } from "lucia";
import { HxButton } from "../components/HxButton";
import { LayoutHtml } from "../components/Layout";
import { MatchDescription } from "../components/MatchDescription";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getRatingEvents } from "../db/queries/ratingEventQueries";
import { getSeason } from "../db/queries/seasonQueries";
import { processQuestEventsForDisplay } from "../lib/questDisplayUtils";
import { getMatchRatingDiff, getRatingSystem } from "../lib/rating";
import { isDefined } from "../lib/utils";

export const matchResult = new Elysia({
  prefix: "/result",
})
  .use(ctx)
  .get("/:seasonId/:matchId", ({ html, params, session }) => {
    return html(
      page(
        session,
        parseInt(params.seasonId, 10),
        parseInt(params.matchId, 10),
      ),
    );
  });

async function page(
  session: Session | null,
  seasonId: number,
  matchId: number,
) {
  const season = await getSeason(seasonId);
  if (!season) {
    return <LayoutHtml>Season not found</LayoutHtml>;
  }
  const ratingSystem = getRatingSystem(
    season.ratingSystem ?? "elo",
    season.ratingEventSystem,
  );

  const [allMatchesInSeason, ratingEvents] = await Promise.all([
    getMatches(seasonId, !!session?.user),
    getRatingEvents(seasonId),
  ]);

  const allMatchesInSeasonSorted = allMatchesInSeason.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const matchesUpToTarget = allMatchesInSeasonSorted.slice(
    0,
    allMatchesInSeasonSorted.findIndex((x) => x.id === matchId) + 1,
  );

  const match = matchesUpToTarget.at(-1);
  if (!match) {
    return <LayoutHtml>Match not found</LayoutHtml>;
  }

  const matchDiff = getMatchRatingDiff(
    matchesUpToTarget,
    ratingEvents,
    ratingSystem,
  )
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

  // Filter completed quest events associated with the specific match ID
  const relevantCompletedEvents = ratingEvents.filter(
    (event) =>
      event.matchId === matchId && // Filter by matchId
      event.type.endsWith("Completed"), // Filter for Completed quest types
  );

  const processedEvents = processQuestEventsForDisplay(
    relevantCompletedEvents, // Use the correctly filtered list
    ratingSystem,
  );

  const completionsByPlayer: Record<
    string,
    { eventType: string; bonus: string; playerId: string; playerName: string }[]
  > = {};

  for (const item of processedEvents) {
    const playerName =
      matchDiff.find((p) => p.playerId === item.playerId)?.playerName ??
      "Unknown";
    if (!completionsByPlayer[item.playerId]) {
      completionsByPlayer[item.playerId] = [];
    }
    completionsByPlayer[item.playerId].push({
      eventType: item.description,
      bonus: item.bonusString,
      playerId: item.playerId,
      playerName: playerName,
    });
  }

  const questCompletionInfo = Object.entries(completionsByPlayer).map(
    ([playerId, completions]) => ({
      playerId,
      playerName: completions[0]?.playerName ?? "Unknown",
      completions: completions.map((c) => ({
        eventType: c.eventType,
        bonus: c.bonus,
      })),
    }),
  );

  return (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="result" />
      <span class="py-5 text-4xl font-bold">Match result</span>
      <div class="mb-6 flex flex-col gap-3">
        <MatchDescription match={match} />
      </div>
      <RatingDiffTable>
        {matchDiff.map((playerDiff) => (
          <RatingDiffTableRow {...playerDiff} />
        ))}
      </RatingDiffTable>

      {/* Conditionally render Quest Log only if quest system is enabled and there are completions */}
      {season.ratingEventSystem === "quest" &&
        questCompletionInfo.length > 0 && (
          <>
            <span class="mt-6 py-5 text-2xl font-bold">Quest Log</span>
            <QuestLogTable questCompletions={questCompletionInfo} />
          </>
        )}
    </LayoutHtml>
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

interface QuestCompletionInfo {
  playerId: string;
  playerName: string;
  completions: { eventType: string; bonus: string }[];
}

function QuestLogTable({
  questCompletions,
}: {
  questCompletions: QuestCompletionInfo[];
}): JSX.Element {
  return (
    <>
      <div class="mt-4 flex flex-col items-center justify-center">
        <div class="w-full overflow-x-auto rounded-lg shadow-md">
          <table class="w-full text-left text-sm text-white">
            <thead class="bg-gray-700 text-xs uppercase text-gray-400">
              <tr>
                <th scope="col" class="px-1 py-3 pl-2 md:px-3 lg:px-6">
                  Player
                </th>
                <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
                  Quest Completed
                </th>
                <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
                  Bonus
                </th>
              </tr>
            </thead>
            <tbody>
              {questCompletions.map((playerInfo) =>
                playerInfo.completions.map((completion, index) => (
                  <tr class="border-b border-gray-700 bg-gray-800">
                    {index === 0 ? (
                      <td
                        rowspan={playerInfo.completions.length}
                        class="whitespace-nowrap px-1 py-4 pl-2 align-top font-medium text-white md:px-3 lg:px-6"
                      >
                        <img
                          class="mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
                          src={`/static/user/${playerInfo.playerId}/small`}
                          loading="lazy"
                          alt=""
                        />
                        <HxButton
                          class="text-left align-middle"
                          hx-get={`/profile/${playerInfo.playerId}`}
                        >
                          {playerInfo.playerName}
                        </HxButton>
                      </td>
                    ) : null}
                    <td class="px-1 py-4 md:px-3 lg:px-6">
                      {completion.eventType}
                    </td>
                    <td class="px-1 py-4 text-green-500 md:px-3 lg:px-6">
                      {completion.bonus}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
