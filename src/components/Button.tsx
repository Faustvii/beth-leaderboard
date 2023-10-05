import { type GetRoutes } from "../types/htmx";

export const AnchorButtonHtml = ({
  href,
  text,
  hxGet,
  hxTarget,
}: {
  hxGet?: GetRoutes;
  hxTarget?: string;
  href?: string;
  text: string;
}) => (
  <>
    <a
      {...(href && { href: href })}
      {...(hxGet && { "hx-get": hxGet })}
      hx-indicator=".progress-bar"
      {...(hxTarget && { "hx-target": hxTarget })}
      class="mx-1 rounded-lg bg-blue-500 px-2 py-2 text-white transition duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
    >
      {text}
    </a>
  </>
);
