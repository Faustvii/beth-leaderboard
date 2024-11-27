import { type Season } from "../../../db/schema/season";
import { EditIcon, TrashIcon } from "../../../lib/icons";
import { cn } from "../../../lib/utils";

interface ExistingSeasonsProps {
  seasons: Season[];
}

export const ExistingSeasons = ({ seasons }: ExistingSeasonsProps) => {
  return (
    <div class="flex flex-col gap-3">
      <div class="hidden gap-3 px-4 font-semibold md:flex">
        <p class="w-[10%]">Name</p>
        <p class="w-1/5">Start</p>
        <p class="w-1/5">End</p>
        <p class="w-[15%]">Rating System</p>
        <p class="w-1/5">Rating Event System</p>
      </div>
      {seasons.map((season) => (
        <div class="flex flex-col items-center rounded-lg border px-4 py-2 md:flex-row md:gap-3">
          <p class="w-full pt-3 font-semibold md:hidden">Name</p>
          <p class="w-full truncate md:w-[10%]">{season.name}</p>
          <p class="w-full pt-3 font-semibold md:hidden">Start</p>
          <p class="w-full truncate md:w-1/5">
            {season.startAt.toLocaleString("en-US", {
              hourCycle: "h24",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p class="w-full pt-3 font-semibold md:hidden">End</p>
          <p class="w-full truncate md:w-1/5">
            {season.endAt.toLocaleString("en-US", {
              hourCycle: "h24",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p class="w-full pt-3 font-semibold md:hidden">Rating System</p>
          <p class="w-full truncate md:w-[15%]">
            {season.ratingSystem.toUpperCase()}
          </p>
          <p class="w-full pt-3 font-semibold md:hidden">Rating Event System</p>
          <p class="w-full truncate md:w-1/5">
            {season.ratingEventSystem.toUpperCase()}
          </p>

          <div
            class={cn("mb-2 ml-auto mt-4 flex w-full md:mb-0 md:mt-0 md:w-24")}
          >
            <button
              hx-get={`admin/season/${season.id}`}
              hx-target="#mainContainer"
              hx-swap="afterend"
              class={cn(
                "flex w-1/2 justify-center gap-3 rounded-l-lg p-2",
                "md:bg-transparent md:hover:bg-transparent md:hover:text-teal-600",
                "bg-teal-700 hover:bg-teal-700/85 hover:text-gray-300",
              )}
              _={`on htmx:afterSettle js htmx.process(document.body) end`}
            >
              <EditIcon />
              <p class="md:hidden">Edit</p>
            </button>
            <button
              type="button"
              class={cn(
                "flex w-1/2 justify-center gap-3 rounded-r-lg p-2",
                "bg-red-700 hover:bg-red-700/85 hover:text-gray-300",
                "md:bg-transparent md:hover:bg-transparent md:hover:text-red-600 md:disabled:text-gray-600",
              )}
              hx-indicator=".progress-bar"
              hx-target="#mainContainer"
              hx-delete={`admin/season/${season.id}`}
              hx-disabled-elt="this"
              hx-confirm="Are you sure you wish to delete this season?"
              _="on htmx:beforeRequest set innerText of <p/> in me to 'Deleting...'"
            >
              <TrashIcon />
              <p class="md:hidden">Delete</p>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
