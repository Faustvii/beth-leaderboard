import { type PropsWithChildren } from "@kitajs/html";

export const HxButton = ({
  children,
  ...props
}: PropsWithChildren<JSX.HtmlButtonTag>) => (
  <>
    <button
      hx-indicator=".progress-bar"
      hx-target="#mainContainer"
      hx-swap="innerHTML"
      hx-push-url="true"
      {...props}
    >
      {children}
    </button>
  </>
);
