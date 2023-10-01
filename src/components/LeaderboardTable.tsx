import { LeaderboardRowHtml } from "./LeaderboardRow";

export const LeaderboardTableHtml = ({
  rows,
  page,
}: {
  page: number;
  rows: { rank: number; name: string; elo: number }[];
}) => (
  <>
    <div class="flex flex-col items-center justify-center px-3 pb-12 md:px-4 md:pb-24 lg:px-12">
      <div class="w-full overflow-x-auto rounded-lg shadow-md">
        <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-1 py-3 md:px-3 lg:px-6">
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
