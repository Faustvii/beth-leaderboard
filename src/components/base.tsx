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
      <title>THE BETH STACK</title>
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
      <script src="https://unpkg.com/htmx.org/dist/ext/response-targets.js"></script>
      <script src="https://unpkg.com/hyperscript.org@0.9.11"></script>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css"
      />
      <link rel="stylesheet" href="/public/dist/unocss.css" />
      <link rel="icon" href="data:;base64,="></link>
      <script>{safeScript}</script>
    </head>
    <body hx-boost="true" class="h-screen">
      <NavbarHtml session={session} />
      {children}
    </body>
  </html>
);
