import { SelectGet } from "./SelectGet";
import { getSeasons } from "../db/queries/seasonQueries";
import {
  prettyRatingSystemType,
  type Rating,
  type RatingSystem,
  type TimeInterval,
} from "../lib/ratings/rating";

interface SeasonPickerProps {
  basePath: string;
  season: { id: number };
  ratingSystem?: RatingSystem<Rating>;
  timeInterval?: TimeInterval;
}

export const SeasonPicker = async ({
  basePath,
  season,
  ratingSystem,
  timeInterval,
}: SeasonPickerProps) => {
  const seasons = await getSeasons();

  const options = seasons.map((s) => {
    const params = new URLSearchParams();
    params.set("season", s.id.toString());
    if (ratingSystem) {
      params.set("ratingSystem", ratingSystem.type);
    }
    if (timeInterval) {
      params.set("interval", timeInterval);
    }
    return {
      path: `${basePath}?${params.toString()}`,
      text: s.name,
    };
  });

  const selectedIndex = seasons.findIndex((s) => s.id === season.id);

  return <SelectGet options={options} selectedIndex={selectedIndex} />;
};

const path = (basePath: string, params: Record<string, string | undefined>) => {
  const paramPart = Object.entries(params)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return `${basePath}?${paramPart}`;
};
