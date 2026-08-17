import { type PropsWithChildren } from "@kitajs/html";
import { ChristmasHtml } from "../controllers/holidays/christmas";
import { FridayHtml } from "../controllers/holidays/friday";
import { HalloweenHtml } from "../controllers/holidays/halloween";
import { getCurrentHolidays } from "../controllers/holidays/holidayController";
import { ValentineHtml } from "../controllers/holidays/valentine";
import { getCurrentUser } from "../lib/store";
import { cssVariables, toCssBlock } from "../styles/theme-styles";
import { GitHubLinkHtml } from "./GitHubLink";
import { LoadingBarHtml } from "./LoadingBar";

export const BaseHtml = async ({ children }: PropsWithChildren) => {
  const holiday = getCurrentHolidays();
  const isItChristmas = holiday.christmas;
  const isItValentine = holiday.valentine;
  const isItHalloween = holiday.halloween;
  const isItFriday = holiday.friday;

  const user = getCurrentUser();
  const showHolidays = user?.settings?.showHolidays ?? true;

  return (
    <>
      {"<!DOCTYPE html>"}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="theme-color" content="#000000" />
          <title>BETH Leaderboard</title>
          <script src="https://unpkg.com/htmx.org@1.9.6"></script>
          <script src="https://unpkg.com/htmx.org@1.9.6/dist/ext/response-targets.js"></script>
          <script src="https://unpkg.com/hyperscript.org@0.9.11"></script>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <link href="/static/styles.css" rel="stylesheet" />
          <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <style>{toCssBlock(cssVariables)}</style>
        </head>
        <body
          hx-boost="true"
          class="
        background-animate
        h-screen
        w-full
        bg-bg-base
        bg-gradient-to-b
        from-bg-gradient-from via-bg-gradient-via to-bg-gradient-to font-roboto-mono
        text-text-primary
        "
        >
          {showHolidays && isItChristmas && (
            <ChristmasHtml renderLayer="background" />
          )}
          {showHolidays && isItFriday && (
            <FridayHtml renderLayer="background" />
          )}
          {showHolidays && isItValentine && (
            <ValentineHtml renderLayer="background" />
          )}
          {showHolidays && isItHalloween && (
            <HalloweenHtml renderLayer="background" />
          )}
          <LoadingBarHtml />
          <div style="position: relative;">{children}</div>
          {/* {isItFriday && <FridayHtml renderLayer="effects" />} REENABLE EFTER JUL*/}
          {showHolidays && isItHalloween && (
            <HalloweenHtml renderLayer="effects" />
          )}
          {showHolidays && isItValentine && (
            <ValentineHtml renderLayer="effects" />
          )}
          {showHolidays && isItChristmas && (
            <ChristmasHtml renderLayer="effects" />
          )}
          <GitHubLinkHtml />
        </body>
      </html>
    </>
  );
};
