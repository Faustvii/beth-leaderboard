import { type Match } from "../lib/ratings/rating";
import {
  isSingles,
  SEAT_NAMES,
  TEAM_LABELS,
  TEAM_SEATS,
  teamSeatNames,
  type Seat,
} from "../lib/seats";
import { DateAndTimePicker } from "./DateAndTimePicker";
import { UserLookUp } from "./UserLookup";

interface MatchFormProps {
  formId: string;
  actionButtons: JSX.Element;
  match?: Match;
}

export const MatchForm = async ({
  formId,
  actionButtons,
  match,
}: MatchFormProps) => {
  let createdDate = "";
  let createdTime = "";
  // Seats are only recorded for 2v2 matches; a 1v1 has nothing to edit here.
  const showSeats = match !== undefined && !isSingles(match);

  if (match?.createdAt) {
    const [day, , month, , year, , hour, , minute] = new Intl.DateTimeFormat(
      "en-GB",
      {
        dateStyle: "short",
        timeStyle: "long",
        timeZone: "Europe/Copenhagen",
      },
    ).formatToParts(match.createdAt);

    createdDate = `${year.value}-${month.value}-${day.value}`;
    createdTime = `${hour.value}:${minute.value}`;
  }

  return (
    <>
      <form
        class="flex w-full flex-col"
        method="post"
        id={formId}
        hx-ext="response-targets"
        enctype="multipart/form-data"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="outerHTML"
        hx-target={`#${formId}`}
        hx-params="not name,includeEmail"
        hx-target-400="#errors"
      >
        {/* TODO: Use flex with gap instead */}
        {/* White side = Tog/Kantine team (seats 1 + 3) */}
        <div class="group relative mb-6 w-full border-b">
          <span>
            {TEAM_LABELS.White}
            <span class="text-sm text-gray-400">
              {" "}
              · seats {teamSeatNames("White")}
            </span>
          </span>
        </div>
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label={`${TEAM_LABELS.White} player 1`}
            input="white1"
            user={match?.whitePlayerOne}
            required={true}
          />
        </div>
        {showSeats && (
          <SeatSelect
            formId={formId}
            name="white1Seat"
            team="White"
            value={match.whitePlayerOneSeat}
          />
        )}
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label={`${TEAM_LABELS.White} player 2 (optional)`}
            input="white2"
            user={match?.whitePlayerTwo}
          />
        </div>
        {showSeats && (
          <SeatSelect
            formId={formId}
            name="white2Seat"
            team="White"
            value={match.whitePlayerTwoSeat}
          />
        )}

        {/* Black side = Mute/Rønslev team (seats 2 + 4) */}
        <div class="group relative mb-6 w-full border-b">
          <span>
            {TEAM_LABELS.Black}
            <span class="text-sm text-gray-400">
              {" "}
              · seats {teamSeatNames("Black")}
            </span>
          </span>
        </div>
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label={`${TEAM_LABELS.Black} player 1`}
            input="black1"
            user={match?.blackPlayerOne}
            required={true}
          />
        </div>
        {showSeats && (
          <SeatSelect
            formId={formId}
            name="black1Seat"
            team="Black"
            value={match.blackPlayerOneSeat}
          />
        )}
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label={`${TEAM_LABELS.Black} player 2 (optional)`}
            input="black2"
            user={match?.blackPlayerTwo}
          />
        </div>
        {showSeats && (
          <SeatSelect
            formId={formId}
            name="black2Seat"
            team="Black"
            value={match.blackPlayerTwoSeat}
          />
        )}

        {/* Winner and points */}
        <div class="group relative mb-6 w-full border-b">
          <span>Match result</span>
        </div>

        <div class="group relative mb-6 w-full">
          <select
            name="match_winner"
            form={formId}
            id="match_winner"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0 [&>option]:text-gray-900"
            required={true}
          >
            <option disabled value="" selected={match ? false : true}>
              Select a winner
            </option>
            <option
              value="White"
              selected={match?.result === "White" ? true : false}
            >
              {TEAM_LABELS.White}
            </option>
            <option
              value="Black"
              selected={match?.result === "Black" ? true : false}
            >
              {TEAM_LABELS.Black}
            </option>
            <option
              value="Draw"
              selected={match?.result === "Draw" ? true : false}
            >
              Draw
            </option>
          </select>
          <label
            for="match_winner"
            class="absolute top-3 origin-[0] -translate-y-6 scale-75 transform bg-gray-900 text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
          >
            Match Winner
          </label>
        </div>
        <div class="group relative mb-6 w-full">
          <input
            type="number"
            value={match?.scoreDiff.toString()}
            form={formId}
            name="point_difference"
            id="point_difference"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
            placeholder=" "
            required={true}
            min="0"
            max="960"
            step="5"
          />
          <label
            for="point_difference"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
          >
            Point difference
          </label>
        </div>
        {/* Only show date and time picker if editing existing match */}
        {match && (
          <DateAndTimePicker
            formId={formId}
            initialDate={createdDate}
            initialTime={createdTime}
          />
        )}
        {actionButtons}
        <div id="errors" class="text-red-500"></div>
        {match && (
          <input type="hidden" name="match_id" value={match.id.toString()} />
        )}
      </form>
    </>
  );
};

/**
 * Admin-only seat correction (2v2 only). White players sit N/S, black players E/W; an empty selection on all
 * four clears the seating for the match.
 */
const SeatSelect = ({
  formId,
  name,
  team,
  value,
}: {
  formId: string;
  name: string;
  team: "White" | "Black";
  value: Seat | null;
}) => (
  <div class="group relative -mt-3 mb-6 w-full">
    <select
      name={name}
      id={`${formId}-${name}`}
      form={formId}
      class="peer block w-full appearance-none border-0 border-b-2 border-gray-600 bg-transparent px-0 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-0 [&>option]:text-gray-900"
    >
      <option value="" selected={value === null}>
        Seat unknown
      </option>
      {TEAM_SEATS[team].map((seat) => (
        <option value={seat} selected={value === seat}>
          Seat {SEAT_NAMES[seat]}
        </option>
      ))}
    </select>
    <label
      for={`${formId}-${name}`}
      class="absolute top-3 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-400"
    >
      Seat
    </label>
  </div>
);
