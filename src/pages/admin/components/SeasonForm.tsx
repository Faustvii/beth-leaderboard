import { type Season } from "../../../db/schema/season";
import { cn } from "../../../lib/utils";

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

  if (season?.startAt) startAt = season.startAt.toISOString().split("T")[0];
  if (season?.endAt) endAt = season.endAt.toISOString().split("T")[0];

  return (
    <form
      id={formId}
      method="post"
      enctype="multipart/form-data"
      hx-ext="response-targets"
      hx-target-400="#errors"
    >
      <div
        class={cn("mt-3 flex flex-col gap-3 py-2", !season && "lg:flex-row")}
      >
        <div class="flex w-full flex-col">
          <label for="seasonName" class="font-semibold">
            Season name
          </label>
          <input
            id="seasonName"
            name="seasonName"
            form={formId}
            class="rounded-sm px-2 py-1 text-black"
            type="text"
            value={
              season?.name ??
              `Season ${amountOfSeasons ? amountOfSeasons + 1 : "name"}`
            }
          />
        </div>
        <div class="flex w-full flex-col">
          <label for="seasonStart" class="font-semibold">
            Start
          </label>
          <input
            id="seasonStart"
            name="seasonStart"
            form={formId}
            class="rounded-sm px-2 py-1 text-black"
            type="date"
            value={startAt}
          />
        </div>
        <div class="flex w-full flex-col">
          <label for="seasonEnd" class="font-semibold">
            End
          </label>
          <input
            id="seasonEnd"
            name="seasonEnd"
            form={formId}
            class="rounded-sm px-2 py-1 text-black"
            type="date"
            value={endAt}
          />
        </div>
        <div class="flex w-full flex-col">
          <label for="ratingSystemSelect" class="truncate font-semibold">
            Rating system
          </label>
          <select
            id="ratingSystemSelect"
            name="ratingSystem"
            form={formId}
            class="h-[34px] rounded-sm px-2 py-1 text-black"
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
        </div>
        {actionButtons}
      </div>
      <div id="errors" class="text-red-500"></div>
      {season && <input hidden name="seasonId" value={season.id.toString()} />}
    </form>
  );
};
