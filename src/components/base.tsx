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
        <link href="/public/styles.css" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="icon" href="/public/favicon-16x16.png" sizes="16x16" />
        <link rel="icon" href="/public/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/public/favicon-192x192.png" sizes="192x192" />
        <link rel="icon" href="/public/favicon-512x512.png" sizes="512x512" />

        <link
          rel="shortcut icon"
          sizes="192x192"
          href="/public/favicon-192x192.png"
        />
      </head>
      <body
        hx-boost="true"
        class="
        background-animate
        h-screen
        w-full
        bg-slate-800
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
