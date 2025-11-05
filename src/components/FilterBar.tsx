import { type Season } from "../db/schema/season";
import {
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";
import { RatingSystemPicker } from "./RatingSystemPicker";
import { SeasonPicker } from "./SeasonPicker";
import { TimeIntervalPicker } from "./TimeIntervalPicker";

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
