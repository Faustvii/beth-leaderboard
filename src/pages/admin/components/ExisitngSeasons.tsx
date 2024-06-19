import { type Season } from "../../../db/schema/season";
import { EditIcon, TrashIcon } from "../../../lib/icons";
import { cn } from "../../../lib/utils";

interface ExistingSeasonsProps {
  seasons: Season[];
}

export const ExistingSeasons = ({ seasons }: ExistingSeasonsProps) => {
  return (
    <div class="mt-3 flex flex-col gap-3">
      <div class="flex gap-3 px-4 font-semibold ">
        <p class="w-[10%]">Name</p>
        <p class="w-1/4">Start</p>
        <p class="w-1/4">End</p>
        <p class="w-1/4">Rating System</p>
      </div>
      {seasons.map((season) => (
        <div class="flex items-center gap-3 rounded-lg border px-4 py-2">
          <p class="w-[10%]">{season.name}</p>
          <p class="w-1/4 truncate">
            {season.startAt.toLocaleString("en-US", {
              hourCycle: "h24",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p class="w-1/4 truncate">
            {season.endAt.toLocaleString("en-US", {
              hourCycle: "h24",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>{season.ratingSystem.toUpperCase()}</p>

          <div class={cn(" ml-auto flex")}>
            <button
              hx-get={`admin/season/${season.id}`}
              hx-target="#mainContainer"
              hx-swap="afterend"
              class={cn(
                "flex w-1/2 justify-center gap-3 rounded-l-lg",
                "p-2 hover:text-teal-600",
              )}
              _={`on htmx:afterSettle js htmx.process(document.body) end`}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              class={cn(
                "flex w-1/2 justify-center gap-3 rounded-r-lg",
                "p-2 hover:text-red-600 disabled:bg-gray-600",
              )}
              hx-indicator=".progress-bar"
              hx-target="#mainContainer"
              hx-delete={`admin/season/${season.id}`}
              hx-disabled-elt="this"
              hx-confirm="Are you sure you wish to delete this season?"
              _="on htmx:beforeRequest set innerText of <p/> in me to 'Deleting...'"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
