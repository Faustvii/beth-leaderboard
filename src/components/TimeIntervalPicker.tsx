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
  currentInterval: TimeInterval | undefined | "simple";
  season: Season | { id: number };
  ratingSystem: RatingSystem<Rating>;
}) {
  const intervals: { value: TimeInterval | "simple"; label: string }[] = [
    { value: "simple", label: "No Changes" },
    { value: "today", label: "Today" },
    { value: "daily", label: "Yesterday" },
    { value: "weekly", label: "Last 7 days" },
    { value: "monthly", label: "Last 30 days" },
  ];

  const selectedValue = currentInterval ?? "today";

  const options = intervals.map((interval) => {
    const params = new URLSearchParams();
    params.set("season", season.id.toString());
    params.set("ratingSystem", ratingSystem.type);
    if (interval.value !== "simple") {
      params.set("interval", interval.value);
    } else {
      params.set("interval", "simple");
    }
    return {
      path: `${basePath}?${params.toString()}`,
      text: interval.label,
    };
  });

  const selectedIndex = intervals.findIndex((i) => i.value === selectedValue);

  return <SelectGet options={options} selectedIndex={selectedIndex} />;
}
