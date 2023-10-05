import { type PropsWithChildren } from "@kitajs/html";
import { type Session } from "lucia";
import { config } from "../config";
import { liveReloadScript } from "../lib/liveReloadScript";
import { LoadingBarHtml } from "./LoadingBar";
import { MainContainer } from "./MainContainer";
import { NavbarHtml } from "./Navbar";

const safeScript =
  config.env.NODE_ENV === "development" ? liveReloadScript() : "";

const safe2 = liveReloadScript({ url: "ws://localhost:3000/queue" });

interface PropsWithSession extends PropsWithChildren {
  session: Session | null;
}

export const BaseHtml = ({ children, session }: PropsWithSession) => (
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
        <link href="/static/styles.css" rel="stylesheet" />
        <link rel="icon" href="data:;base64,="></link>
        <script>{safeScript}</script>
        {/* <script>{safe2}</script> */}
      </head>
      <body
        hx-boost="true"
        class="h-screen w-full place-items-center bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      >
        <LoadingBarHtml />
        <NavbarHtml session={session} />
        <MainContainer children={children} />
      </body>
    </html>
  </>
);
