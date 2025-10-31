import { ChartConfiguration } from "chart.js";

export const playerWinRateChartConfig = (winRate: {
  wonGames: number;
  draws: number;
  lostGames: number;
  winPercentage: number;
}): ChartConfiguration => {
  const colorWinrateData = {
    labels: ["Won", "Lost", "Draw"],
    datasets: [
      {
        label: "Matches",
        data: [winRate.wonGames, winRate.lostGames, winRate.draws],
        backgroundColor: ["#fffffe", "rgb(35, 43, 43)", "#ff8906"],
        hoverOffset: 4,
      },
    ],
  };

  return {
    type: "doughnut",
    data: colorWinrateData,
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
          borderWidth: 0,
        },
      },
    },
  };
};
