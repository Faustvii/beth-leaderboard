import { type PropsWithChildren } from "@kitajs/html";

export const AnchorButtonHtml = ({
  children,
  ...props
}: PropsWithChildren<JSX.HtmlAnchorTag>) => (
  <>
    <a
      hx-indicator=".progress-bar"
      class="mx-1 rounded-lg bg-blue-500 px-2 py-2 transition duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
      {...props}
    >
      {children}
    </a>
  </>
);
