import { UserLookUp } from "./UserLookup";

interface MatchFormProps {
  formId: string;
  formMethod: string;
  actionButtons: JSX.Element;
}

export const MatchForm = async ({
  formId,
  formMethod,
  actionButtons,
}: MatchFormProps) => {
  return (
    <>
      <form
        class="flex w-full flex-col"
        method={formMethod}
        id={formId}
        hx-ext="response-targets"
        enctype="multipart/form-data"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="outerHTML"
        hx-target={`#${formId}`}
        hx-params="not name"
        hx-target-400="#errors"
      >
        {/* TODO: Use flex with gap instead */}
        {/* White team */}
        <div class="group relative mb-6 w-full border-b">
          <span class="text-white">White team</span>
        </div>
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label="White player 1"
            input="white1"
            required={true}
          />
        </div>
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label="White player 2 (optional)"
            input="white2"
          />
        </div>

        {/* Black team */}
        <div class="group relative mb-6 w-full border-b">
          <span class="text-white">Black team</span>
        </div>
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label="Black player 1"
            input="black1"
            required={true}
          />
        </div>
        <div class="group relative mb-6 w-full">
          <UserLookUp
            formId={formId}
            label="Black player 2 (optional)"
            input="black2"
          />
        </div>

        {/* Winner and points */}
        <div class="group relative mb-6 w-full border-b">
          <span class="text-white">Match result</span>
        </div>

        <div class="group relative mb-6 w-full">
          <select
            name="match_winner"
            form={formId}
            id="match_winner"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm   text-white focus:border-blue-500 focus:outline-none focus:ring-0"
            required={true}
          >
            <option disabled value="" selected={true}>
              Select a winner
            </option>
            <option>White</option>
            <option>Black</option>
            <option>Draw</option>
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
            form={formId}
            name="point_difference"
            id="point_difference"
            class="peer block w-full appearance-none border-0 border-b-2  border-gray-600 bg-transparent px-0 py-2.5   text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-0"
            placeholder=" "
            required={true}
            min="0"
            max="960"
            step="5"
          />
          <label
            for="point_difference"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm  text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
          >
            Point difference
          </label>
        </div>
        {actionButtons}
        <div id="errors" class="text-red-500"></div>
      </form>
    </>
  );
};
