import { cn } from "../lib/utils";
import { MatchResultLink } from "./MatchResultLink";

// Interface for processed quest event data
export interface ProcessedQuestEventItem {
  id: number;
  date: Date;
  description: string;
  outcome: "Completed" | "Failed" | "Unknown";
  bonusString: string; // Renamed from 'bonus'
  matchId: number | null;
  playerId: string;
  playerName: string;
}

// Props for the component
interface QuestEventLogTableProps {
  questEvents: ProcessedQuestEventItem[];
  seasonId: number;
  showDateColumn?: boolean;
  showPlayerColumn?: boolean;
  title?: string;
}

export function QuestEventLogTable({
  questEvents,
  seasonId,
  showDateColumn = false,
  showPlayerColumn = false,
  title,
}: QuestEventLogTableProps): JSX.Element | null {
  if (questEvents.length === 0) {
    return null;
  }

  return (
    <>
      {title && <span class="mt-6 py-5 text-2xl font-bold">{title}</span>}
      <div class="mt-4 w-full overflow-x-auto rounded-lg shadow-md">
        <table class="w-full text-left text-sm text-white">
          <thead class="bg-gray-700 text-sm font-semibold text-white">
            <tr>
              {showDateColumn && (
                <th scope="col" class="px-4 py-3">
                  Date
                </th>
              )}
              {showPlayerColumn && (
                <th scope="col" class="px-1 py-3 pl-2 md:px-3 lg:px-6">
                  Player
                </th>
              )}
              <th scope="col" class="px-4 py-3">
                Quest
              </th>
              <th scope="col" class="px-4 py-3">
                Outcome
              </th>
              <th scope="col" class="px-4 py-3">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {questEvents.map((item) => (
              <tr class="border-b border-gray-700 bg-gray-800">
                {/* Date Column */}
                {showDateColumn && (
                  <td class="whitespace-nowrap px-4 py-2">
                    {item.date.toLocaleString("en-US", {
                      day: "numeric",
                      month: "long",
                    })}
                  </td>
                )}
                {/* Player Column */}
                {showPlayerColumn && (
                  <td class="whitespace-nowrap px-1 py-4 pl-2 font-medium text-white md:px-3 lg:px-6">
                    <img
                      class="mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
                      src={`/static/user/${item.playerId}/small`}
                      loading="lazy"
                      alt=""
                    />
                    <a
                      hx-get={`/profile/${item.playerId}`}
                      hx-push-url="true"
                      hx-target="#mainContainer"
                      class="cursor-pointer align-middle"
                    >
                      {item.playerName}
                    </a>
                  </td>
                )}
                {/* Description/Quest Column */}
                <td class="px-4 py-2">
                  {item.matchId ? (
                    <MatchResultLink seasonId={seasonId} matchId={item.matchId}>
                      {item.description}
                    </MatchResultLink>
                  ) : (
                    <span>{item.description}</span>
                  )}
                </td>
                {/* Outcome Column */}
                <td
                  class={cn("px-4 py-2", {
                    "text-green-500": item.outcome === "Completed",
                    "text-red-500": item.outcome === "Failed",
                  })}
                >
                  {item.outcome}
                </td>
                {/* Bonus/Result Column */}
                <td
                  class={cn("px-4 py-2", {
                    "text-green-500": item.outcome === "Completed",
                    "text-red-500": item.outcome === "Failed",
                  })}
                >
                  {item.bonusString} {/* Use bonusString */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
