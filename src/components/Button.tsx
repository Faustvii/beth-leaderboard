import { type PropsWithChildren } from "@kitajs/html";

export const AnchorButtonHtml = ({
  children,
  ...props
}: PropsWithChildren<JSX.HtmlAnchorTag>) => (
  <>
    <a
      hx-indicator=".progress-bar"
      class="mx-1 rounded-lg bg-action px-2 py-2 transition duration-200 hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-action-focus focus:ring-opacity-50"
      {...props}
    >
      {children}
    </a>
  </>
);
