import { SelectGet } from "../../../components/SelectGet";
import { getSeasons } from "../../../db/queries/seasonQueries";
import { ratingSystemTypes, Season } from "../../../db/schema/season";
import {
  prettyRatingSystemType,
  Rating,
  RatingSystem,
} from "../../../lib/ratings/rating";

interface SeasonPickerProps {
  basePath: string;
  season: { id: number };
  ratingSystem?: RatingSystem<Rating>;
}

export const SeasonPicker = async ({
  basePath,
  season,
  ratingSystem,
}: SeasonPickerProps) => {
  const seasons = await getSeasons();

  return (
    <div class="flex flex-row gap-2 p-5">
      <SelectGet
        options={seasons.map((s) => ({
          path: path(basePath, {
            season: s.id.toString(),
            ratingSystem: ratingSystem?.type,
          }),
          text: s.name,
        }))}
        selectedIndex={seasons.findIndex((s) => s.id === season.id)}
      />
      {ratingSystem && (
        <SelectGet
          options={ratingSystemTypes.map((t) => ({
            path: path(basePath, {
              season: season.id.toString(),
              ratingSystem: t,
            }),
            text: prettyRatingSystemType(t),
          }))}
          selectedIndex={ratingSystemTypes.findIndex(
            (t) => ratingSystem.type === t,
          )}
        />
      )}
    </div>
  );
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
