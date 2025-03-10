import { isDateOlderThanNDays } from "../lib/dateUtils";
import { RESULT } from "../lib/matchStatistics";
import { HxButton } from "./HxButton";

export const LeaderboardRowHtml = async ({
  userId,
  rank,
  name,
  rating,
  lastPlayed,
  latestPlayerResults,
  isCurrentSeason,
  isLowestRanked,
}: {
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
  isCurrentSeason: boolean;
  isLowestRanked: boolean;
}) => {
  const { loseStreak, results, winStreak } = latestPlayerResults || {};

  const streak = winStreak || loseStreak || undefined;
  const isWinStreak = !!winStreak;

  return (
    <tr class="border-b border-gray-700 bg-gray-800">
      <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">
        <Rank rank={rank} isLowestRanked={isLowestRanked} />
      </td>
      <th
        scope="row"
        class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-white md:flex md:px-3 lg:px-6"
      >
        <div class="col-span-2">
          <WinLoseStreak
            lastPlayed={lastPlayed}
            streak={streak}
            isWinStreak={isWinStreak}
            isCurrentSeason={isCurrentSeason}
          />
        </div>
        <img
          class="col-span-2 mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
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
      <td class="px-1 py-4 md:px-3 lg:px-6">{rating}</td>
    </tr>
  );
};

const Rank = ({
  rank,
  isLowestRanked,
}: {
  rank: number;
  isLowestRanked: boolean;
}) => {
  if (isLowestRanked) {
    return (
      <span aria-label="last place" class="text-xl">
        👎
      </span>
    );
  }

  switch (rank) {
    case 1:
      return (
        <span aria-label="1st place" class="text-xl">
          🥇
        </span>
      );
    case 2:
      return (
        <span aria-label="2nd place" class="text-xl">
          🥈
        </span>
      );
    case 3:
      return (
        <span aria-label="3rd place" class="text-xl">
          🥉
        </span>
      );
    default:
      return <span>{rank}.</span>;
  }
};

export const WinLoseStreak = ({
  streak,
  isWinStreak,
  lastPlayed,
  isCurrentSeason,
}: {
  lastPlayed: Date | undefined;
  streak: number | undefined;
  isWinStreak: boolean;
  isCurrentSeason: boolean;
}) => {
  if (isCurrentSeason && lastPlayed && isDateOlderThanNDays(lastPlayed, 7)) {
    return <span class="pr-2 text-2xl">💤</span>;
  }
  if (streak && streak === 5) {
    return <span class="pr-2 text-2xl">{isWinStreak ? "🤑" : "🗑️"}</span>;
  }

  if (streak && streak >= 3) {
    return <span class="pr-2 text-2xl">{isWinStreak ? "🔥" : "❄️"}</span>;
  }

  return <span class="invisible pr-2 text-2xl">〰️</span>;
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
        } else if (res === RESULT.LOSS) {
          return <span>❌</span>;
        } else {
          return <span>⬜</span>;
        }
      })}
    </div>
  );
};
