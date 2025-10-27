import { type RESULT } from "../lib/matchStatistics";
import { HxButton } from "./HxButton";
import { isDefined } from "../lib/utils";

export const LeaderboardRowHtml = ({
  userId,
  rank,
  name,
  rating,
  ratingBefore,
  rankBefore,
  lastPlayed,
  latestPlayerResults,
  isCurrentSeason,
  isLowestRanked,
}: {
  userId: string;
  rank: number;
  name: string;
  rating: number;
  ratingBefore?: number;
  rankBefore?: number;
  lastPlayed: Date;
  latestPlayerResults: {
    winStreak: number;
    loseStreak: number;
    results: RESULT[];
  } | null;
  isCurrentSeason: boolean;
  isLowestRanked: boolean;
}) => (
  <tr class="border-b border-gray-700 bg-gray-800">
    <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">
      <span class="inline-block w-4">{rank}.</span>
      <DiffIcon
        before={rankBefore}
        after={rank}
        isHigherBetter={false}
      />
    </td>
    <th
      scope="row"
      class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-white md:flex md:px-3 lg:px-6"
    >
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
      </div>
    </th>
    <td class="px-1 py-4 md:px-3 lg:px-6">
      <span class="inline-block w-8">{rating}</span>
      <DiffIcon
        before={ratingBefore}
        after={rating}
        isHigherBetter={true}
      />
    </td>
  </tr>
);

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