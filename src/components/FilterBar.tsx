import { SeasonPicker } from "./SeasonPicker";
import { RatingSystemPicker } from "./RatingSystemPicker";
import { TimeIntervalPicker } from "./TimeIntervalPicker";
import { type Season } from "../db/schema/season";
import { type RatingSystem, type Rating, type TimeInterval } from "../lib/ratings/rating";

export async function FilterBar({
  basePath,
  season,
  ratingSystem,
  timeInterval,
}: {
  basePath: string;
  season: Season | { id: number };
  ratingSystem?: RatingSystem<Rating>;
  timeInterval?: TimeInterval;
}) {
  return (
    <div class="flex flex-row gap-2 p-5">
      <TimeIntervalPicker
        basePath={basePath}
        currentInterval={timeInterval}
        season={season}
        ratingSystem={ratingSystem!}
      />
      <SeasonPicker
        basePath={basePath}
        season={season}
        ratingSystem={ratingSystem}
        timeInterval={timeInterval}
      />
      {ratingSystem && (
        <RatingSystemPicker
          basePath={basePath}
          season={season}
          ratingSystem={ratingSystem}
          timeInterval={timeInterval}
        />
      )}
    </div>
  );
}