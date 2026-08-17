import { cn } from "../lib/utils";

interface SelectGetProps {
  options: { path: string; text: string }[];
  selectedIndex?: number;
  target?: string;
  selectClass?: string;
  optionClass?: string;
}

export const SelectGet = ({
  options,
  selectedIndex,
  target,
  selectClass,
  optionClass,
}: SelectGetProps) => (
  <select
    class={cn(
      "border-border-input-light block w-full rounded-lg border bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-action focus:ring-action dark:border-border-input dark:bg-surface-hover dark:text-text-primary dark:placeholder-text-muted dark:focus:border-action dark:focus:ring-action",
      selectClass,
    )}
    _={`on change
        set targetUrl to event.srcElement.value
        fetch \`\${targetUrl}\`
        then put it after ${target ?? "#mainContainer"}
        then remove ${target ?? "#mainContainer"}
        then call htmx.process(document.body)`}
  >
    {options.map((x, i) => (
      <option
        class={optionClass ?? ""}
        value={x.path}
        selected={i === selectedIndex}
      >
        {x.text}
      </option>
    ))}
  </select>
);
