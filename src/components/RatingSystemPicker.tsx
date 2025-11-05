import { ratingSystemTypes } from "../db/schema/season";
import {
  prettyRatingSystemType,
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";
import { SelectGet } from "./SelectGet";

interface RatingSystemPickerProps {
  basePath: string;
  season: { id: number };
  ratingSystem: RatingSystem<Rating>;
  timeInterval?: TimeInterval;
}

export const RatingSystemPicker = ({
  basePath,
  season,
  ratingSystem,
  timeInterval,
}: RatingSystemPickerProps) => {
  const options = ratingSystemTypes.map((t) => {
    const params = new URLSearchParams();
    params.set("season", season.id.toString());
    params.set("ratingSystem", t);
    if (timeInterval) {
      params.set("interval", timeInterval);
    }
    return {
      path: `${basePath}?${params.toString()}`,
      text: prettyRatingSystemType(t),
    };
  });

  const selectedIndex = ratingSystemTypes.findIndex(
    (t) => ratingSystem.type === t,
  );

  return <SelectGet options={options} selectedIndex={selectedIndex} />;
};
