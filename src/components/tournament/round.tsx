import { type PropsWithChildren } from "@kitajs/html";

export const RoundHtml = ({
  children,
  ...props
}: PropsWithChildren<JSX.HtmlAnchorTag>) => (
  <div class="col-span-1 flex flex-col justify-evenly" {...props}>
    {...children}
  </div>
);
