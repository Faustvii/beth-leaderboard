export const LeaderboardRowHtml = ({
  rank,
  name,
  elo,
  last,
  page,
}: {
  rank: number;
  name: string;
  elo: number;
  last: boolean;
  page: number;
}) => (
  <>
    {last ? (
      <tr
        class="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
        hx-get={`/leaderboard/page/${page + 1}`}
        hx-trigger="revealed"
        hx-swap="afterend"
      >
        <td class="px-6 py-4">{rank}.</td>
        <th
          scope="row"
          class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
        >
          {name}
        </th>
        <td class="px-6 py-4">{elo}</td>
      </tr>
    ) : (
      <tr class="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
        <td class="px-6 py-4">{rank}.</td>
        <th
          scope="row"
          class="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
        >
          {name}
        </th>
        <td class="px-6 py-4">{elo}</td>
      </tr>
    )}
  </>
);
