import { cn } from "../lib/utils";

interface Props {
  children: JSX.Element;
  title: string;
  doubleSize?: boolean;
  start_open?: boolean;
}

export const FoldableCard = ({
  title,
  children,
  doubleSize,
  start_open,
}: Props) => (
  <details
    class={cn(
      doubleSize ? "col-span-6 md:col-span-12" : "col-span-6",
      "flex h-full flex-col rounded-lg p-5",
      "group",
    )}
    open={start_open ?? false}
  >
    <summary class="flex border-b-[1px] border-primary/60 p-2 text-2xl font-semibold">
      <div class="block w-[34px] group-open:hidden">👉🏻</div>
      <div class="hidden w-[34px] group-open:block">👇🏻</div>
      <h2 class="ml-2">{title}</h2>
    </summary>
    <div class="flex h-full w-full flex-col items-center justify-evenly gap-3 py-4 md:flex-row">
      {children}
    </div>
  </details>
);
