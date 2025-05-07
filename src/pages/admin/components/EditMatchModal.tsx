import { MatchForm } from "../../../components/MatchForm";
import { type Match } from "../../../lib/ratings/rating";
import { cn } from "../../../lib/utils";

interface EditMatchModalProps {
  match: Match;
}

export const EditMatchModal = ({ match }: EditMatchModalProps) => {
  return (
    <div
      id="edit-match-modal"
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
        <h1 class="mb-4 text-2xl font-semibold">Edit match</h1>
        <MatchForm
          formId={`edit-match-${match.id}-form`}
          match={match}
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
                hx-put="/admin/match"
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
