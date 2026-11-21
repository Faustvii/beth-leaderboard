import { type User } from "../../../db/schema/auth";
import { EditIcon } from "../../../lib/icons";
import { cn } from "../../../lib/utils";

interface Props {
  results: User[];
}

export const EditUserSearchResults = ({ results }: Props) => {
  return (
    <>
      {results.map((u) => (
        <button
          type="button"
          hx-get={`edit-user/${u.id}`}
          hx-target="#mainContainer"
          hx-swap="afterend"
          class={cn(
            "flex w-full flex-wrap items-center justify-between gap-2 border-b border-border-light p-3 text-left",
            "last:rounded-b-lg last:border-b-0",
            "hover:bg-primary/50",
            "focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/50",
          )}
          _="on htmx:afterSettle js htmx.process(document.body) end"
        >
          <div class="min-w-0 flex-1 pl-2">
            <span class="block truncate">{u.name}</span>
            {u.email ? (
              <span class="block truncate text-sm text-text-muted">
                {u.email}
              </span>
            ) : null}
          </div>
          <div
            class={cn(
              "pointer-events-none flex shrink-0 items-center gap-2 text-text-secondary",
            )}
          >
            <EditIcon />
            <span class="hidden sm:inline">Edit</span>
          </div>
        </button>
      ))}
    </>
  );
};
