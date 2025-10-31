import { type Season } from "../db/schema/season";
import {
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";
import { SelectGet } from "./SelectGet";

export function TimeIntervalPicker({
  basePath,
  currentInterval,
  season,
  ratingSystem,
}: {
  basePath: string;
  currentInterval: TimeInterval | undefined;
  season: Season | { id: number };
  ratingSystem: RatingSystem<Rating>;
}) {
  const intervals: { value: TimeInterval | "none"; label: string }[] = [
    { value: "none", label: "No Changes" },
    { value: "daily", label: "Last 24 hours" },
    { value: "weekly", label: "Last 7 days" },
    { value: "monthly", label: "Last 30 days" },
  ];

  const selectedValue = currentInterval || "none";

  const options = intervals.map((interval) => {
    const params = new URLSearchParams();
    params.set("season", season.id.toString());
    params.set("ratingSystem", ratingSystem.type);
    if (interval.value !== "none") {
      params.set("interval", interval.value);
    }
    return {
      path: `${basePath}?${params.toString()}`,
      text: interval.label,
    };
  });

  const selectedIndex = intervals.findIndex((i) => i.value === selectedValue);

  return <SelectGet options={options} selectedIndex={selectedIndex} />;
}
