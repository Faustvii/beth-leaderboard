import { MatchDescription } from "../../components/MatchDescription";
import { EditIcon, TrashIcon } from "../../lib/icons";
import { cn } from "../../lib/utils";

interface MatchCardProps {
  match: MatchWithPlayers;
}

export const MatchCard = ({ match }: MatchCardProps) => {
  return (
    <div
      id={match.id}
      class={cn(
        "border-1 mb-3 flex w-full flex-col gap-3 rounded-md border p-4 shadow-md",
        "lg:mb-[1%] lg:w-[49.5%]",
      )}
    >
      <MatchDescription match={match} />
      <div class={cn("mt-auto flex")}>
        <button
          hx-get={`admin/match/${match.id}`}
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
          type="Remove match"
          class={cn(
            "mt-2 flex w-1/2 justify-center gap-3 rounded-r-lg",
            "bg-red-700 p-2 hover:bg-red-700/85 disabled:bg-gray-600",
          )}
          hx-indicator=".progress-bar"
          hx-delete={`admin/match/${match.id}`}
          hx-target="#mainContainer"
          hx-disabled-elt="this"
          hx-confirm="Are you sure you wish to delete this match?"
          _="on htmx:beforeRequest set innerText of <p/> in me to 'Deleting...'"
        >
          <TrashIcon />
          <p class="hidden sm:block">Delete</p>
        </button>
      </div>
    </div>
  );
};
