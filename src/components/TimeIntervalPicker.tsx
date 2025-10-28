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

  return (
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-400">Changes:</label>
      <select
        name="interval"
        class="rounded-lg border border-gray-600 bg-gray-700 p-2 text-sm text-white focus:border-blue-500 focus:ring-blue-500"
        hx-get={basePath}
        hx-target="body"
        hx-push-url="true"
        hx-include="[name='season'], [name='ratingSystem']"
      >
        {intervals.map((interval) => (
          <option
            value={interval.value === "none" ? "" : interval.value}
            selected={selectedValue === interval.value}
          >
            {interval.label}
          </option>
        ))}
      </select>
      <input type="hidden" name="season" value={season.id.toString()} />
      <input type="hidden" name="ratingSystem" value={ratingSystem.type} />
    </div>
  );
}
