import { type PropsWithChildren } from "@kitajs/html";
import Elysia from "elysia";
import { type Session } from "lucia";
import { HxButton } from "../components/HxButton";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getSeason } from "../db/queries/seasonQueries";
import { notEmpty } from "../lib";
import { getMatchRatingDiff, getRatingSystem, type Match } from "../lib/rating";

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
  const ratingSystem = getRatingSystem(season?.ratingSystem ?? "elo");

  const allMatchesInSeason = await getMatches(seasonId);
  const matches = allMatchesInSeason.slice(
    0,
    allMatchesInSeason.findIndex((x) => x.id === matchId) + 1,
  );

  const match = matches.at(-1);

  const matchDiff = getMatchRatingDiff(matches, ratingSystem)
    .map((x) => ({
      playerId: x.player.id,
      playerName: x.player.name,
      ratingBefore: x.ratingBefore ? ratingSystem.toNumber(x.ratingBefore) : -1,
      ratingAfter: ratingSystem.toNumber(x.ratingAfter),
      rankBefore: x.rankBefore,
      rankAfter: x.rankAfter,
    }))
    .toSorted((a, b) => a.rankAfter - b.rankAfter);

  return (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="result" />
      <div class="p-5 text-white">
        <span class="text-4xl font-bold">Match result</span>
        <span class="pl-4 text-2xl font-semibold">
          (
          {match?.createdAt?.toLocaleString("en-US", {
            day: "numeric",
            month: "long",
          })}
          )
        </span>
      </div>
      <div class="px-5 pb-6 text-white">{matchDescription(match)}</div>
      <RatingDiffTable>
        {matchDiff.map((playerDiff) => (
          <RatingDiffTableRow {...playerDiff} />
        ))}
      </RatingDiffTable>
    </LayoutHtml>
  );
}

function matchDescription(match: Match | undefined) {
  if (match === undefined) {
    return <></>;
  }

  const players = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };

  return (
    <>
      On{" "}
      {match.createdAt.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      })}
      , the White team of{" "}
      <span class="font-bold">{players.white.join(" & ")}</span> faced off
      against the Black team of{" "}
      <span class="font-bold">{players.black.join(" & ")}</span>. The{" "}
      {match.result.toLowerCase()} team triumphed with a {match.scoreDiff}
      -point difference.
    </>
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
  ratingBefore: number;
  ratingAfter: number;
  rankBefore: number;
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
  before: number;
  after: number;
  isHigherBetter: boolean;
}): JSX.Element {
  const areDefined = !!before && before > 0 && !!after && after > 0;
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
