import { RESULT } from "../lib/matchStatistics";
import { HxButton } from "./HxButton";

export const LeaderboardRowHtml = async ({
  userId,
  rank,
  name,
  elo,
  first,
  page,
  latestPlayerResults,
}: {
  userId: string;
  rank: number;
  name: string;
  elo: number;
  first: boolean;
  page: number;
  latestPlayerResults: {
    winStreak: number;
    loseStreak: number;
    results: RESULT[];
  } | null;
}) => {
  const { loseStreak, results, winStreak } = latestPlayerResults || {};

  const streak = winStreak || loseStreak || undefined;
  const isWinStreak = !!winStreak ?? !!loseStreak;

  return (
    <>
      {first ? (
        <tr
          class="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
          hx-get={`/leaderboard/page/${page + 1}`}
          _="on htmx:afterRequest remove @hx-trigger from me"
          hx-indicator=".progress-bar"
          hx-trigger="intersect once"
          hx-swap="beforeend"
          hx-target={`#nextPageData`}
        >
          <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">{rank}.</td>
          <th
            scope="row"
            class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-gray-900 dark:text-white md:flex md:px-3 lg:px-6"
          >
            <div class="col-span-2">
              <WinLoseStreak streak={streak} isWinStreak={isWinStreak} />
            </div>
            <img
              class="col-span-2 mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
              src={`/static/user/${userId}/small`}
              loading="lazy"
              alt=""
            />
            <div class="col-span-8 flex flex-col gap-0 text-left">
              <HxButton
                class="w-44 overflow-hidden truncate whitespace-nowrap text-left"
                hx-get={`/profile/${userId}`}
              >
                {name}
              </HxButton>
              <LatestResults latestPlayerResults={results} />
            </div>
          </th>
          <td class="px-1 py-4 md:px-3 lg:px-6">{elo}</td>
        </tr>
      ) : (
        <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
          <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">{rank}.</td>
          <th
            scope="row"
            class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-gray-900 dark:text-white md:flex md:px-3 lg:px-6"
          >
            <div class="col-span-2">
              <WinLoseStreak streak={streak} isWinStreak={isWinStreak} />
            </div>
            <img
              class="col-span-2 mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
              src={`/static/user/${userId}/small`}
              loading="lazy"
              alt=""
            />
            <div class="col-span-8 flex flex-col gap-0 text-left">
              <HxButton
                class="w-44 overflow-hidden truncate whitespace-nowrap text-left md:w-full"
                hx-get={`/profile/${userId}`}
              >
                {name}
              </HxButton>
              <LatestResults latestPlayerResults={results} />
            </div>
          </th>
          <td class="px-1 py-4 md:px-3 lg:px-6">{elo}</td>
        </tr>
      )}
    </>
  );
};

export const WinLoseStreak = ({
  streak,
  isWinStreak,
}: {
  streak: number | undefined;
  isWinStreak: boolean;
}) => {
  if (streak && streak === 5) {
    return <span class="pr-2 text-2xl">{isWinStreak ? "🤑" : "🗑️"}</span>;
  }

  if (streak && streak >= 3) {
    return <span class="pr-2 text-2xl">{isWinStreak ? "🔥" : "❄️"}</span>;
  }

  return <></>;
};

export const LatestResults = ({
  latestPlayerResults,
}: {
  latestPlayerResults: RESULT[] | undefined;
}) => {
  return (
    <div class="flex gap-2">
      {latestPlayerResults?.map((res) => {
        if (res === RESULT.WIN) {
          return <span>✅</span>;
        } else if (res === RESULT.LOSE) {
          return <span>❌</span>;
        } else {
          return <span>⬜</span>;
        }
      })}
    </div>
  );
};
