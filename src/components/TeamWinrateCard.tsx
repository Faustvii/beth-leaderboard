import type MatchStatistics from "../lib/matchStatistics";
import { StatsCardHtml } from "./StatsCard";

type SeatStats = ReturnType<typeof MatchStatistics.winsBySeat>;

interface Props {
  stats: SeatStats;
}

export const TeamWinrateCard = ({ stats }: Props) => (
  <StatsCardHtml title="Winrate By Team">
    {stats.totalGames === 0 ? (
      <span class="text-sm text-gray-400">No seated matches yet</span>
    ) : (
      <>
        <div class="flex flex-col items-center justify-center gap-1">
          <span class="text-5xl">{stats.teams.White.wins}</span>
          <span class="text-md">
            {stats.teams.White.procentage.toFixed(2)}%
          </span>
          <span class="text-xl">{stats.teams.White.label} wins</span>
        </div>
        <div class="flex flex-col items-center justify-center gap-1">
          <span class="text-5xl">{stats.draws.count}</span>
          <span class="text-md">{stats.draws.procentage.toFixed(2)}%</span>
          <span class="text-xl">Draws</span>
        </div>
        <div class="flex h-full flex-col items-center justify-center gap-1">
          <span class="text-5xl">{stats.teams.Black.wins}</span>
          <span class="text-md">
            {stats.teams.Black.procentage.toFixed(2)}%
          </span>
          <span class="text-xl">{stats.teams.Black.label} wins</span>
        </div>
      </>
    )}
  </StatsCardHtml>
);
