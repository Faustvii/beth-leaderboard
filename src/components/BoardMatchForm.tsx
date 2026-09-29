import clsx from "clsx";
import { SearchIcon } from "../lib/icons";
import {
  SEAT_NAMES,
  seatValues,
  TEAM_LABELS,
  teamSeatNames,
  type Seat,
} from "../lib/seats";
import { cn } from "../lib/utils";

interface BoardMatchFormProps {
  formId: string;
}

const SEAT_GRID: Record<Seat, string> = {
  N: "row-start-1 col-start-2",
  W: "row-start-2 col-start-1",
  E: "row-start-2 col-start-3",
  S: "row-start-3 col-start-2",
};


 //Top down board for logging a match
export const BoardMatchForm = ({ formId }: BoardMatchFormProps) => (
  <form
    class="mx-auto flex w-full max-w-2xl flex-col gap-6"
    method="post"
    id={formId}
    hx-post="/match"
    hx-ext="response-targets"
    enctype="multipart/form-data"
    hx-indicator=".progress-bar"
    hx-sync="this:abort"
    hx-swap="innerHTML"
    hx-params="not name"
    hx-target-400="#board-errors"
  >

    <div class="flex flex-col gap-3">
      <div class="group relative w-full">
        <SearchIcon />
        <input
          id={`${formId}-search`}
          hx-trigger="keyup[event.key !== 'Enter'] changed delay:300ms"
          hx-sync="this:replace"
          hx-swap="innerHTML"
          hx-get="/match/search?target=tray"
          hx-indicator=".progress-bar"
          hx-target={`#${formId}-search-results`}
          hx-params="name"
          name="name"
          placeholder=" "
          autocomplete="off"
          class={clsx([
            "peer block w-full appearance-none px-0 py-2.5 pl-10 text-sm",
            "border-0 border-b-2 border-gray-300 bg-transparent",
            "focus:border-blue-500 focus:outline-none focus:ring-0",
          ])}
          _={`on focus remove @hidden from #${formId}-search-results`}
        />
        <label
          for={`${formId}-search`}
          class={clsx([
            "absolute top-3 -z-10 origin-[0] pl-10 text-sm text-gray-400",
            "-translate-y-6 scale-75 transform duration-300",
            "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
            "peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-500",
          ])}
        >
          Add players to the game
        </label>
        <div
          id={`${formId}-search-results`}
          class="search-results absolute z-50 w-full rounded-b-lg bg-slate-600 shadow-md shadow-slate-900/5"
        />
      </div>
      <p class="rounded-lg border border-dashed border-gray-500 p-3 text-sm text-gray-400">
        <span class="pointer-text">
          Click a seat and search for a player, to add them to the game
        </span>
        <span class="touch-text hidden">
          Tap a seat and search for a player, to add them to the game
        </span>
      </p>
      <p id="tray-message" class="min-h-[1.25rem] text-sm text-red-400" />
    </div>

    {/* Board with four seats */}
    <div class="mx-auto grid w-full max-w-[560px] grid-cols-[1fr_auto_1fr] grid-rows-[auto_1fr_auto] items-center gap-1 sm:grid-cols-[minmax(6.5rem,1fr)_minmax(0,2fr)_minmax(6.5rem,1fr)]">
      <img
        src="/static/crokBoard.webp"
        alt="Crokinole board seen from above"
        class="col-start-2 row-start-2 aspect-square w-36 select-none sm:w-full"
      />
      {seatValues.map((seat) => (
        <SeatZone seat={seat} />
      ))}
    </div>

    {/* Winner */}
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-sm text-gray-400">Who won?</legend>
      <select
        name="winner"
        id={`${formId}-winner-select`}
        class="winner-select block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0 sm:hidden [&>option]:text-gray-900"
        required
      >
        <option value="" selected>
          Select a winner
        </option>
        <option value="NS" data-team="White">
          {TEAM_LABELS.White}
        </option>
        <option value="Draw">Draw</option>
        <option value="EW" data-team="Black">
          {TEAM_LABELS.Black}
        </option>
      </select>
      <div class="winner-buttons hidden gap-2 sm:grid sm:grid-cols-3">
        <WinnerOption
          value="NS"
          team="White"
          label={TEAM_LABELS.White}
          hint={`Seats ${teamSeatNames("White")}`}
        />
        <WinnerOption value="Draw" label="Draw" />
        <WinnerOption
          value="EW"
          team="Black"
          label={TEAM_LABELS.Black}
          hint={`Seats ${teamSeatNames("Black")}`}
        />
      </div>
    </fieldset>

    {/* Points */}
    <div class="group relative w-full">
      <input
        type="number"
        form={formId}
        name="point_difference"
        id={`${formId}-points`}
        class="peer block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
        placeholder=" "
        required={true}
        min="0"
        max="960"
        step="5"
      />
      <label
        for={`${formId}-points`}
        class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
      >
        Point difference
      </label>
    </div>

    <button
      type="submit"
      class="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
    >
      Submit match result
    </button>
    <div id="board-errors" class="text-red-500" />

    <template id="chip-template">
      <div class="chip flex max-w-full cursor-pointer select-none items-center gap-1 rounded-full bg-slate-600 py-1 pl-3 pr-1 text-sm">
        <span class="chip-name min-w-0 max-w-[12rem] truncate" />
        <button
          type="button"
          class="chip-remove rounded-full px-1.5 text-gray-300 hover:bg-slate-500 hover:text-white"
          aria-label="Remove player"
        >
          &times;
        </button>
      </div>
    </template>
  </form>
);

const SeatZone = ({ seat }: { seat: Seat }) => {
  const team = seat === "N" || seat === "S" ? "White" : "Black";
  return (
    <div
      class={cn(
        "seat flex min-h-[3.5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2 py-1.5 text-center transition-colors",
        team === "White" ? "border-sky-500/60" : "border-rose-500/60",
        SEAT_GRID[seat],
      )}
      data-seat={seat}
    >
      <input type="hidden" name={`seat${seat}`} />
      <span class="flex w-full flex-col items-center text-xs text-gray-400 sm:block">
        <span class="uppercase tracking-wide">Seat {SEAT_NAMES[seat]}</span>
        <span class="seat-team max-w-full truncate text-gray-500">
          <span class="hidden sm:inline"> · </span>
          {TEAM_LABELS[team]}
        </span>
      </span>
      <div class="seat-slot flex min-h-[1.75rem] w-full min-w-0 items-center justify-center" />
    </div>
  );
};

const WinnerOption = ({
  value,
  team,
  label,
  hint,
}: {
  value: "NS" | "EW" | "Draw";
  team?: "White" | "Black";
  label: string;
  hint?: string;
}) => (
  <label class="winner-option flex cursor-pointer" data-team={team}>
    <input
      type="radio"
      name="winner"
      value={value}
      class="peer sr-only"
      required
    />
    <span class="flex w-full flex-col items-center justify-center rounded-lg border border-gray-600 px-3 py-2 text-sm peer-checked:border-primary peer-checked:bg-primary/20 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-disabled:opacity-40">
      <span class="winner-label truncate font-medium">{label}</span>
      {hint && <span class="winner-hint text-xs text-gray-400">{hint}</span>}
    </span>
  </label>
);
