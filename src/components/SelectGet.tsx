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
      "block w-full rounded-lg border p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500",
      "border-gray-600 bg-gray-700 text-white placeholder-gray-400",
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
