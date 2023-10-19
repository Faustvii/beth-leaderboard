import { type RESULT } from "../lib/matchStatistics";
import { LeaderboardRowHtml } from "./LeaderboardRow";

export const LeaderboardTableHtml = ({
  rows,
  page,
}: {
  page: number;
  rows: {
    userId: string;
    rank: number;
    name: string;
    elo: number;
    lastPlayed: Date;
    latestPlayerResults: {
      winStreak: number;
      loseStreak: number;
      results: RESULT[];
    } | null;
  }[];
}) => (
  <>
    <div class="flex flex-col items-center justify-center">
      <div class="w-full overflow-x-auto rounded-lg shadow-md">
        <table class="w-full text-left text-sm text-gray-400">
          <thead class=" bg-gray-700 text-xs uppercase text-gray-400">
            <tr>
              <th scope="col" class="px-1 py-3 pl-2 md:px-3 lg:px-6">
                Rank
              </th>
              <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
                Name
              </th>
              <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
                Elo
              </th>
            </tr>
          </thead>
          <tbody id="nextPageData">
            {rows.map((row, index) => (
              <LeaderboardRowHtml {...row} first={index === 0} page={page} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);
