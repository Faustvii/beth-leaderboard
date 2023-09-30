import { liveReloadScript } from "beth-stack/dev";
import { type PropsWithChildren } from "beth-stack/jsx";
import { type Session } from "lucia";
import { config } from "../config";
import { NavbarHtml } from "./Navbar";

const safeScript =
  config.env.NODE_ENV === "development" ? liveReloadScript() : "";

interface PropsWithSession extends PropsWithChildren {
  session: Session | null;
}

export const BaseHtml = ({ children, session }: PropsWithSession) => (
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <title>THE BETH STACK</title>
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
      <script src="https://unpkg.com/htmx.org/dist/ext/response-targets.js"></script>
      <script src="https://unpkg.com/hyperscript.org@0.9.11"></script>
      <link href="/public/dist/styles.css" rel="stylesheet" />
      <link rel="icon" href="data:;base64,="></link>
      <style>
        {`
          [data-loading] {
            display: none;
          }
        `}
      </style>
      <script>{safeScript}</script>
    </head>
    <body
      hx-boost="true"
      hx-ext="loading-states"
      class="h-screen w-full place-items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
    >
      <NavbarHtml session={session} />
      {children}
    </body>
  </html>
);
