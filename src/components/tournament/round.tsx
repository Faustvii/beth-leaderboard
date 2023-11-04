import { type PropsWithChildren } from "@kitajs/html";

export const RoundHtml = ({
  children,
  ...props
}: PropsWithChildren<JSX.HtmlAnchorTag>) => (
  <div class="relative col-span-1 flex flex-col justify-around" {...props}>
    {...children}
  </div>
);
