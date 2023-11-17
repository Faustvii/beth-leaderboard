import clsx from "clsx";
import { SearchIcon } from "../../../lib/icons";

interface Props extends JSX.HtmlInputTag {
  input: string;
  label: string;
  needed?: boolean;
}

export const UserLookUp = ({ ...props }: Props) => (
  <>
    <script>
      {function checkUserKeydown(event: Event) {
        // Don't submit a search on enter or when selecting an entry with the mouse
        return event instanceof KeyboardEvent && event.key !== "Enter";
      }}
    </script>
    <SearchIcon />
    <input
      id={`${props.input}-input`}
      form="matchForm"
      hx-trigger="keyup[checkUserKeydown.call(this, event)] changed delay:300ms"
      hx-sync="this:replace"
      hx-swap="innerHtml"
      hx-get="/match/search"
      hx-indicator=".progress-bar"
      hx-target={`#${props.input}-results`}
      hx-params="name"
      name="name"
      placeholder=" "
      autocomplete="off"
      class={clsx([
        "peer block w-full appearance-none px-0 py-2.5 pl-10 text-sm text-white",
        "border-0 border-b-2 border-gray-300 bg-transparent",
        "focus:border-blue-500 focus:outline-none focus:ring-0",
      ])}
      {...props}
      _="on focus remove @hidden from next <div/>"
    />
    <label
      for={`${props.input}-input`}
      class={clsx([
        "absolute top-3 -z-10 origin-[0] pl-10 text-sm text-gray-400",
        "-translate-y-6 scale-75 transform duration-300",
        "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
        "peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-500",
      ])}
    >
      {props.label}
    </label>
    {/* Results from search */}
    <div
      id={`${props.input}-results`}
      class={clsx(
        ["bg-slate-600 text-white"],
        ["rounded-b-lg shadow-md shadow-slate-900/5"],
        ["absolute z-50 w-full"],
      )}
    />
    <input
      type="hidden"
      form="matchForm"
      id={`${props.input}Id`}
      name={`${props.input}Id`}
    />
  </>
);
