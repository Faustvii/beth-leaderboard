import { LeaderboardRowHtml } from "./LeaderboardRow";

export const LeaderboardTableHtml = ({
  rows,
  page,
}: {
  page: number;
  rows: { rank: number; name: string; elo: number }[];
}) => (
  <>
    <div class="flex flex-col items-center justify-center">
      <div class="w-3/4 overflow-x-auto rounded-lg shadow-md">
        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-3">
                Rank
              </th>
              <th scope="col" class="px-6 py-3">
                Name
              </th>
              <th scope="col" class="px-6 py-3">
                Elo
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <LeaderboardRowHtml
                {...row}
                last={index === rows.length - 1}
                page={page}
              />
            ))}
            <tr></tr>
          </tbody>
        </table>
      </div>
    </div>
  </>
);
