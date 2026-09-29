import clsx from "clsx";
import { type User } from "../db/schema/auth";

interface TraySearchResultsProps {
  results: User[];
}

// Search results for the board form
export const TraySearchResults = ({ results }: TraySearchResultsProps) => (
  <>
    {results.map((result) => (
      <button
        type="button"
        class={clsx([
          "tray-add w-full p-3 pl-10 text-left hover:bg-primary/50 last:hover:rounded-b-lg",
          "focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/50 last:focus-visible:rounded-b-lg",
        ])}
        data-user-id={result.id}
        data-name={result.name}
      >
        {result.name}
      </button>
    ))}
  </>
);
