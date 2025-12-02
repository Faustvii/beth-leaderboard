import clsx from "clsx";
import { type User } from "../db/schema/auth";

interface MatchSearchResultsProps {
  includeEmail?: boolean;
  results: User[];
}

export const MatchSearchResults = ({
  results,
  includeEmail = false,
}: MatchSearchResultsProps) => {
  return (
    <>
      {results.map((result) => (
        <button
          id={result.id}
          class={clsx([
            "w-full p-3 pl-10 text-left hover:bg-primary/50 last:hover:rounded-b-lg",
            "focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/50 last:focus-visible:rounded-b-lg",
          ])}
          value={result.name}
          _="on click halt the event then add @hidden to the closest <div/> then put my value into the value of the previous <input/> from me then put my id into the value of the next <input/>"
        >
          {result.name}
          {includeEmail && (
            <span class="pl-2 text-sm text-gray-400">{result.email}</span>
          )}
        </button>
      ))}
    </>
  );
};
