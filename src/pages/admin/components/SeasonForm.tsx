import { type Season } from "../../../db/schema/season";

interface SeasonFormProps {
  formId: string;
  actionButtons: JSX.Element;
  amountOfSeasons?: number;
  season?: Season;
}

export const SeasonForm = ({
  formId,
  actionButtons,
  amountOfSeasons,
  season,
}: SeasonFormProps) => {
  let startAt = "";
  let endAt = "";

  // substring 0 - 16 to remove milliseconds and timezone
  if (season?.startAt) startAt = season.startAt.toISOString().substring(0, 16);
  if (season?.endAt) endAt = season.endAt.toISOString().substring(0, 16);

  return (
    <form
      id={formId}
      method="post"
      enctype="multipart/form-data"
      hx-ext="response-targets"
      hx-target-400="#errors"
    >
      <label for="seasonStart">Start</label>
      <input
        id="seasonStart"
        name="seasonStart"
        form={formId}
        class="text-black"
        type="datetime-local"
        value={startAt}
      />
      <label for="seasonEnd">End</label>
      <input
        id="seasonEnd"
        name="seasonEnd"
        form={formId}
        class="text-black"
        type="datetime-local"
        value={endAt}
      />
      <label for="ratingSystemSelect">Rating system:</label>
      <select
        id="ratingSystemSelect"
        name="ratingSystem"
        form={formId}
        class="text-black"
      >
        <option
          value="openskill"
          selected={season?.ratingSystem === "openskill"}
        >
          Openskill
        </option>
        <option value="elo" selected={season?.ratingSystem === "elo"}>
          ELO
        </option>
      </select>
      <label for="seasonName">Season name:</label>
      <input
        id="seasonName"
        name="seasonName"
        form={formId}
        class="text-black"
        type="text"
        value={
          season?.name ??
          `Season ${amountOfSeasons ? amountOfSeasons + 1 : "name"}`
        }
      />
      {actionButtons}
      <div id="errors" class="text-red-500"></div>
      {season && <input hidden name="seasonId" value={season.id.toString()} />}
    </form>
  );
};
