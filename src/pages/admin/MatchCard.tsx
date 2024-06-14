import { notEmpty } from "../../lib";
import { EditIcon, TrashIcon } from "../../lib/icons";
import { cn } from "../../lib/utils";
import { MatchDetails } from "./MatchDetails";
import { TeamDetails } from "./TeamDetails";

interface MatchCardProps {
  match: MatchWithPlayers;
}

export const MatchCard = ({ match }: MatchCardProps) => {
  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };

  return (
    <div
      id={match.id}
      class={cn(
        "border-1 mb-3 flex w-full flex-col gap-3 rounded-md border p-4 shadow-md",
        "lg:mb-[1%] lg:w-[49.5%]",
      )}
    >
      <div class="flex flex-col justify-between gap-3 lg:flex-row">
        <TeamDetails title={"Team White"} team={teamPlayers.white} />
        <TeamDetails title={"Team Black"} team={teamPlayers.black} />
      </div>
      <MatchDetails
        result={match.result}
        scoreDiff={match.scoreDiff}
        dateLogged={match.createdAt}
      />
      <div class={cn("mt-auto flex")}>
        <button
          hx-get={`admin/match/${match.id}`}
          hx-target="#mainContainer"
          hx-swap="afterend"
          class={cn(
            "mt-2 flex w-1/2 justify-center gap-3 rounded-l-lg",
            "bg-teal-700 p-2 hover:bg-teal-700/85",
          )}
          _={`on htmx:afterRequest wait 1s then js htmx.process(document.body) end`}
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
