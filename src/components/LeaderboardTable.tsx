import { type RESULT } from "../lib/matchStatistics";
import { LeaderboardRowHtml } from "./LeaderboardRow";

export const LeaderboardTableHtml = ({
  rows,
  isCurrentSeason,
}: {
  rows: {
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
  }[];
  isCurrentSeason: boolean;
}) => (
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
          <tbody id="nextPageData">
            {rows.map((row) => (
              <LeaderboardRowHtml
                {...row}
                isCurrentSeason={isCurrentSeason}
                isLowestRanked={row.rank === rows.length}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);