import { type Season } from "../../../db/schema/season";
import { EditIcon, TrashIcon } from "../../../lib/icons";
import { cn } from "../../../lib/utils";

interface ExistingSeasonsProps {
  seasons: Season[];
}

export const ExistingSeasons = ({ seasons }: ExistingSeasonsProps) => {
  return (
    <>
      {seasons.map((season) => (
        <div>
          <p>{season.name}</p>
          <p class="truncate">
            {season.startAt.toLocaleString("en-US", {
              hourCycle: "h24",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p class="truncate">
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
          <div class={cn("mt-auto flex")}>
            <button
              hx-get={`admin/season/${season.id}`}
              hx-target="#mainContainer"
              hx-swap="afterend"
              class={cn(
                "mt-2 flex w-1/2 justify-center gap-3 rounded-l-lg",
                "bg-teal-700 p-2 hover:bg-teal-700/85",
              )}
              _={`on htmx:afterSettle js htmx.process(document.body) end`}
            >
              <EditIcon />
              <p class="hidden sm:block">Edit</p>
            </button>
            <button
              type="button"
              class={cn(
                "mt-2 flex w-1/2 justify-center gap-3 rounded-r-lg",
                "bg-red-700 p-2 hover:bg-red-700/85 disabled:bg-gray-600",
              )}
              hx-indicator=".progress-bar"
              hx-target="#mainContainer"
              hx-delete={`admin/season/${season.id}`}
              hx-disabled-elt="this"
              hx-confirm="Are you sure you wish to delete this season?"
              _="on htmx:beforeRequest set innerText of <p/> in me to 'Deleting...'"
            >
              <TrashIcon />
              <p class="hidden sm:block">Delete</p>
            </button>
          </div>
        </div>
      ))}
    </>
  );
};
