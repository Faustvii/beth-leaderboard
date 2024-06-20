import { type Season } from "../../../db/schema/season";
import { cn } from "../../../lib/utils";
import { SeasonForm } from "./SeasonForm";

interface EditSeasonModalProps {
  season: Season;
}

export const EditSeasonModal = ({ season }: EditSeasonModalProps) => {
  return (
    <div
      id="edit-season-modal"
      class={cn(
        "fixed bottom-0 left-0 right-0 top-0 z-40 backdrop-brightness-50",
        "flex flex-col items-center justify-center",
        // TODO: Add animation
      )}
      _="on closeEditModal remove me"
    >
      <div
        class="absolute bottom-0 left-0 right-0 top-0 -z-50"
        _="on click trigger closeEditModal"
      />
      <div class="-z-20 w-[80%] max-w-[600px] rounded-md bg-slate-800 p-4 text-white shadow-md lg:p-8">
        <h1 class="mb-4 text-2xl font-semibold">Edit season</h1>
        <SeasonForm
          formId={`edit-season-${season.id}-form`}
          season={season}
          actionButtons={
            <div class="mt-3 flex justify-end gap-3">
              <button
                type="button"
                class="rounded-lg bg-red-700 p-2"
                _="on click trigger closeEditModal"
              >
                Cancel
              </button>
              <button
                hx-put="/admin/season"
                type="submit"
                class="rounded-lg bg-teal-700 p-2"
                hx-indicator=".progress-bar"
                _="on click set my.innerText to 'Saving...' then wait for htmx:afterRequest then set my.innerText to 'Save'"
              >
                Save
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
};
