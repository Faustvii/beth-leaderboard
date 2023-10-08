import { type PropsWithChildren } from "@kitajs/html";
import { config } from "../config";
import { liveReloadScript } from "../lib/liveReloadScript";
import { LoadingBarHtml } from "./LoadingBar";

const safeScript =
  config.env.NODE_ENV === "development" ? liveReloadScript() : "";

export const BaseHtml = ({ children }: PropsWithChildren) => (
  <>
    {"<!DOCTYPE html>"}
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <title>BETH Leaderboard</title>
        <script src="https://unpkg.com/htmx.org@1.9.6"></script>
        <script src="https://unpkg.com/htmx.org@1.9.6/dist/ext/ws.js"></script>
        <script src="https://unpkg.com/htmx.org@1.9.6/dist/ext/response-targets.js"></script>
        <link href="/static/styles.css" rel="stylesheet" />
        <link rel="icon" href="data:;base64,="></link>
        <script>{safeScript}</script>
      </head>
      <body
        hx-boost="true"
        class="h-screen w-full place-items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      >
        <LoadingBarHtml />
        {children}
      </body>
    </html>
  </>
);
