import { ChartConfiguration } from "chart.js";

export const colorWinRateChartConfig = (gameResults: {
  blackWins: {
    wins: number;
    procentage: number;
  };
  whiteWins: {
    wins: number;
    procentage: number;
  };
  totalGames: number;
  numOfDraws: {
    draws: number;
    procentage: number;
  };
}): ChartConfiguration => {
  const data = {
    labels: ["White win", "Black win", "Draw"],
    datasets: [
      {
        label: "Matches",
        data: [
          gameResults.whiteWins.wins,
          gameResults.blackWins.wins,
          gameResults.numOfDraws.draws,
        ],
        backgroundColor: ["#fffffe", "rgb(35, 43, 43)", "#D3D3D3"],
        hoverOffset: 4,
      },
    ],
  };

  return {
    type: "doughnut",
    data: data,
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
};
