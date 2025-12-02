import clsx from "clsx";
import { SearchIcon } from "../lib/icons";

interface Props extends JSX.HtmlInputTag {
  formId: string;
  input: string;
  label: string;
  user?: Player | null;
  includeEmail?: boolean;
}

export const UserLookUp = ({
  formId,
  input,
  label,
  user,
  includeEmail = false,
  ...props
}: Props) => (
  <>
    <SearchIcon />
    <input
      type="hidden"
      name="includeEmail"
      value={includeEmail ? "true" : "false"}
      id={`${input}-includeEmail-input`}
    />
    <input
      id={`${input}-input`}
      form={formId}
      hx-trigger="keyup[event.key !== 'Enter'] changed delay:300ms"
      hx-sync="this:replace"
      hx-swap="innerHtml"
      hx-get="/match/search"
      hx-include={`#${input}-includeEmail-input`}
      hx-indicator=".progress-bar"
      hx-target={`#${input}-results`}
      hx-params="name,includeEmail"
      name="name"
      placeholder=" "
      value={user?.name}
      autocomplete="off"
      class={clsx([
        "peer block w-full appearance-none px-0 py-2.5 pl-10 text-sm",
        "border-0 border-b-2 border-gray-300 bg-transparent",
        "focus:border-blue-500 focus:outline-none focus:ring-0",
      ])}
      {...props}
      _={`on focus remove @hidden from #${input}-results`}
    />
    <label
      for={`${input}-input`}
      class={clsx([
        "absolute top-3 -z-10 origin-[0] pl-10 text-sm text-gray-400",
        "-translate-y-6 scale-75 transform duration-300",
        "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
        "peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-500",
      ])}
    >
      {label}
    </label>
    {/* Results from search */}
    <div
      id={`${input}-results`}
      class={clsx([
        "bg-slate-600",
        "rounded-b-lg shadow-md shadow-slate-900/5",
        "absolute z-50 w-full",
      ])}
    />
    <input
      type="hidden"
      value={user?.id}
      form={formId}
      id={`${input}Id`}
      name={`${input}Id`}
    />
  </>
);
