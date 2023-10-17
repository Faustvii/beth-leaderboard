import { type PropsWithChildren } from "@kitajs/html";
import { LoadingBarHtml } from "./LoadingBar";

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
        <script src="https://unpkg.com/hyperscript.org@0.9.11"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="/static/styles.css" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="icon" href="data:;base64,="></link>
      </head>
      <body
        hx-boost="true"
        class="
        background-animate
        h-screen
        w-full
        bg-gradient-to-b
        from-slate-700 via-slate-800 to-gray-900 font-roboto-mono
    "
      >
        <LoadingBarHtml />
        {children}
      </body>
    </html>
  </>
);
