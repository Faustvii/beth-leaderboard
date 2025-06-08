import { cn } from "../lib/utils";

interface HeaderHtmlProps {
  title: string;
  className?: string;
}

export const HeaderHtml = ({ title, className }: HeaderHtmlProps) => (
  <>
    <h1 class={cn("p-5 text-start text-4xl font-bold", className)}>{title}</h1>
  </>
);
