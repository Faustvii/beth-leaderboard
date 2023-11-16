export const MatchupHtml = ({
  team1,
  team2,
  matchNumber,
  result = "Unknown",
}: {
  team1: string;
  team2: string;
  matchNumber: number;
  result?: "Win" | "Loss" | "Unknown";
}) => (
  <div class="relative m-1 h-12 w-48 overflow-hidden rounded-md">
    <div
      class={`border-l-4 ${
        result == "Unknown"
          ? ""
          : result == "Win"
          ? "border-blue-500"
          : "border-red-500"
      } bg-gray-500`}
    >
      <span class="p-2">{team1}</span>
    </div>
    <div
      class={`border-l-4 ${
        result == "Unknown"
          ? ""
          : result == "Loss"
          ? "border-blue-500"
          : "border-red-500"
      } bg-gray-500`}
    >
      <span class="p-2">{team2}</span>
    </div>
    <div class="absolute right-2 top-2 z-10 bg-gray-500 text-red-50">
      <span class="float-right">{matchNumber + 1}</span>
    </div>
  </div>
);
