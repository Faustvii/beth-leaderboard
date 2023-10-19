import { cn } from "../lib/utils";

interface Props {
  children: JSX.Element;
  title: string;
}

export const StatsCardHtml = ({ title, children }: Props) => (
  <div class={cn("col-span-6 flex h-full flex-col rounded-lg p-5 text-white")}>
    <h2 class="border-b-[1px] border-primary/60 p-2 text-2xl font-semibold">
      {title}
    </h2>
    <div class="flex h-full w-full flex-col items-center justify-evenly gap-3 p-4 md:flex-row">
      {children}
    </div>
  </div>
);
