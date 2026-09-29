import type MatchStatistics from "../lib/matchStatistics";
import { SEAT_NAMES, seatValues, type Seat } from "../lib/seats";
import { cn } from "../lib/utils";
import { StatsCardHtml } from "./StatsCard";

type SeatStats = ReturnType<typeof MatchStatistics.winsBySeat>;

interface Props {
  stats: SeatStats;
}

const SEAT_GRID: Record<Seat, string> = {
  N: "col-start-2 row-start-1",
  W: "col-start-1 row-start-2",
  E: "col-start-3 row-start-2",
  S: "col-start-2 row-start-3",
};

// A player's win rate per seat, laid out around the board image
export const SeatWinrateCard = ({ stats }: Props) => (
  <StatsCardHtml title="Winrate By Seat">
    {stats.totalGames === 0 ? (
      <span class="text-sm text-gray-400">No seated matches yet</span>
    ) : (
      <div class="grid w-full max-w-[420px] grid-cols-[1fr_minmax(0,1.4fr)_1fr] grid-rows-[auto_1fr_auto] items-center gap-1">
        <img
          src="/static/crokBoard.webp"
          alt="Crokinole board seen from above"
          class="col-start-2 row-start-2 aspect-square w-full select-none"
        />
        {seatValues.map((seat) => {
          const team = seat === "N" || seat === "S" ? "White" : "Black";
          return (
            <div
              class={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-2 py-1.5 text-center",
                team === "White" ? "border-sky-500/60" : "border-rose-500/60",
                SEAT_GRID[seat],
              )}
            >
              <span class="text-xs uppercase tracking-wide text-gray-400">
                Seat {SEAT_NAMES[seat]}
              </span>
              <span class="text-2xl font-semibold">
                {stats.seats[seat].procentage.toFixed(0)}%
              </span>
              <span class="text-xs text-gray-400">
                {stats.seats[seat].wins}/{stats.seats[seat].games}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </StatsCardHtml>
);
