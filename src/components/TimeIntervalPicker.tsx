import { type Season } from "../db/schema/season";
import {
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";

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

  const buildUrl = (interval: TimeInterval | "none") => {
    const params = new URLSearchParams();
    params.set("season", season.id.toString());
    params.set("ratingSystem", ratingSystem.type);
    if (interval !== "none") {
      params.set("interval", interval);
    }
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-400">Changes:</label>
      <select
        class="rounded-lg border border-gray-600 bg-gray-700 p-2 text-sm text-white focus:border-blue-500 focus:ring-blue-500"
        _={`on change
            set targetUrl to event.srcElement.value
            fetch \`\${targetUrl}\`
            then put it after #mainContainer
            then remove #mainContainer
            then call htmx.process(document.body)`}
      >
        {intervals.map((interval) => (
          <option
            value={buildUrl(interval.value)}
            selected={selectedValue === interval.value}
          >
            {interval.label}
          </option>
        ))}
      </select>
    </div>
  );
}
