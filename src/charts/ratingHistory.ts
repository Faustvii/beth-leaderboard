import { ChartConfiguration } from "chart.js";
import { Rating, RatingSystem } from "../lib/ratings/rating";

const colorFromPrevious = (cur: number, i: number, arr: number[]) => {
  if (i === 0) {
    return "#00FF00";
  }

  const prev = arr[i - 1];

  if (cur >= prev) {
    return "#00FF00";
  }

  return "#FF0000";
};

export const ratingTrendChartConfig = (
  ratingSystem: RatingSystem<Rating>,
  ratingHistory: { date: Date; rating: Rating }[],
): ChartConfiguration => {
  const ratings = ratingHistory.map((x) => ratingSystem.toNumber(x.rating));
  const ratingColor = ratings.map(colorFromPrevious);

  const ratingData = {
    labels: ratingHistory.map((x) =>
      x.date.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      }),
    ),

    datasets: [
      {
        label: "Rating",
        borderColor: "#ff8906",
        data: ratings,
        hoverOffset: 4,
        pointBackgroundColor: ratingColor,
        pointBorderColor: ratingColor,
        tension: 0.1,
      },
    ],
  };

  return {
    type: "line",
    data: ratingData,
    options: {
      scales: {
        y: {
          ticks: {
            color: "#fffffe",
          },
        },
        x: {
          ticks: {
            color: "#fffffe",
          },
        },
      },
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };
};
