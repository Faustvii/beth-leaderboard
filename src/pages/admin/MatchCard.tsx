import { notEmpty } from "../../lib";
import { EditIcon, TrashIcon } from "../../lib/icons";
import { cn } from "../../lib/utils";

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
      class="border-1 mb-3 w-full rounded-md border p-4 shadow-md lg:mb-[1%] lg:w-[49.5%]"
    >
      <p>Team White: {teamPlayers.white.join(" & ")}</p>
      <p>Team Black: {teamPlayers.black.join(" & ")}</p>
      <p>Match winner: Team {match.result}</p>
      <p>Point difference: {match.scoreDiff}</p>
      <p>
        Game logged:{" "}
        {match.createdAt.toLocaleString("en-US", {
          hourCycle: "h24",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div class={cn("flex pt-3")}>
        <button
          class={cn(
            "flex w-1/2 justify-center gap-3 rounded-l-lg bg-teal-600 p-2 hover:bg-teal-600/85",
          )}
          _="on click call alert('Not implemented yet!')"
        >
          <EditIcon />
          <p class="hidden sm:block">Edit</p>
        </button>
        <button
          type="Remove match"
          class={cn(
            "flex w-1/2 justify-center gap-3 rounded-r-lg bg-red-600 p-2 hover:bg-red-600/85 ",
          )}
          hx-delete={`admin/match/${match.id}`}
          _={`on click halt the event then remove #{"${match.id}"}`}
        >
          <TrashIcon />
          <p class="hidden sm:block">Delete</p>
        </button>
      </div>
    </div>
  );
};
