import { ChartConfiguration } from "chart.js";
import { OPENSKILL_OPTIONS, OpenskillRating } from "../lib/ratings/openskillRatingSystem";
import { Rating, RatingSystem } from "../lib/ratings/rating";
import { zip } from "../lib/utils";

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
  if (ratingSystem.type === "openskill") {
    return openskillRatingTrendChartConfig(
      ratingSystem as RatingSystem<OpenskillRating>,
      ratingHistory as { date: Date; rating: OpenskillRating }[],
    );
  }

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

export const openskillRatingTrendChartConfig = (
  openskill: RatingSystem<OpenskillRating>,
  ratingHistory: { date: Date; rating: OpenskillRating }[],
): ChartConfiguration => {

  const labels = ratingHistory.map((x) =>
      x.date.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      }),
  );

  const skillLevel = ratingHistory.map(x => Math.round(x.rating.mu));
  const skillLevelLabels = ratingHistory.map(x => `${Math.round(x.rating.mu)}(±${x.rating.sigma * OPENSKILL_OPTIONS.z})`);
  const uncertaintyUpperBand = ratingHistory.map(x => x.rating.mu + x.rating.sigma * OPENSKILL_OPTIONS.z);
  const uncertaintyLowerBand = ratingHistory.map(x => x.rating.mu - x.rating.sigma * OPENSKILL_OPTIONS.z);
  const trueSkillLevel = ratingHistory.map(x => openskill.toNumber(x.rating));

  return {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Line",
          type: "line",
          backgroundColor: "rgb(75, 192, 192, 0.5)",
          borderColor: "rgb(75, 192, 192)",
          hoverBorderColor: "rgb(175, 192, 192)",
          fill: false,
          tension: 0,
          data: skillLevel,
          yAxisID: "y",
          xAxisID: "x",
        },
        {
          label: "BandTop",
          type: "line",
          backgroundColor: "rgb(75, 192, 255, 0.5)",
          borderColor: "transparent",
          pointRadius: 0,
          fill: 0,
          tension: 0,
          data: uncertaintyUpperBand,
          yAxisID: "y",
          xAxisID: "x",
        },
        {
          label: "BandBottom",
          type: "line",
          backgroundColor: "rgb(75, 192, 255, 0.5)",
          borderColor: "transparent",
          pointRadius: 0,
          fill: 0,
          tension: 0,
          data: uncertaintyLowerBand,
          yAxisID: "y",
          xAxisID: "x",
        },
        {
            label: "Rating",
            borderColor: "#ff8906",
            data: trueSkillLevel,
            hoverOffset: 4,
            // pointBackgroundColor: ratingColor,
            // pointBorderColor: ratingColor,
            tension: 0.1,
            
        }
      ],
    },
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
    // options: {
    //   scales: {
    //     xAxes: [
    //       {
    //         id: "x",
    //         type: "category",
    //       },
    //     ],
    //     yAxes: [
    //       {
    //         id: "y",
    //         type: "linear",
    //         position: "left",
    //         ticks: {
    //           stepSize: 1,
    //         },
    //       },
    //     ],
    //   },
    // },
  };
};
