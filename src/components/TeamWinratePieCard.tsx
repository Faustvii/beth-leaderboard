import { type ChartConfiguration } from "chart.js";
import type MatchStatistics from "../lib/matchStatistics";
import { Chart } from "./Chart";
import { StatsCardHtml } from "./StatsCard";

type SeatStats = ReturnType<typeof MatchStatistics.winsBySeat>;

interface Props {
  stats: SeatStats;
}

export const TeamWinratePieCard = ({ stats }: Props) => {
  const config: ChartConfiguration = {
    type: "doughnut",
    data: {
      labels: [
        `${stats.teams.White.label} win`,
        `${stats.teams.Black.label} win`,
        "Draw",
      ],
      datasets: [
        {
          label: "Matches",
          data: [
            stats.teams.White.wins,
            stats.teams.Black.wins,
            stats.draws.count,
          ],
          backgroundColor: ["#fffffe", "rgb(35, 43, 43)", "#D3D3D3"],
          hoverOffset: 4,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: false,
          labels: {
            color: "#fffffe",
          },
          position: "left",
        },
      },
      elements: {
        arc: {
          borderWidth: 2,
          borderColor: "#ff8906",
        },
      },
    },
  };

  return (
    <StatsCardHtml title="Winrates">
      {stats.totalGames === 0 ? (
        <span class="text-sm text-gray-400">No seated matches yet</span>
      ) : (
        <div class="flex h-48 w-full items-center justify-center pt-5">
          <Chart id="chartDoughnut" config={config}></Chart>
        </div>
      )}
    </StatsCardHtml>
  );
};
