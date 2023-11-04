export const MatchupHtml = ({
  team1,
  team2,
}: {
  team1: string;
  team2: string;
}) => (
  <div class="m-1 h-12 w-48 overflow-hidden rounded-md">
    <div class="border-l-4 border-blue-500 bg-gray-500">
      <span class="p-2">{team1}</span>
    </div>
    <div class="border-l-4 border-red-500 bg-gray-500">
      <span class="p-2">{team2}</span>
    </div>
  </div>
);
