import { type PropsWithChildren } from "@kitajs/html";
import { ChristmasHtml } from "../controllers/holidays/christmas";
import { FridayHtml } from "../controllers/holidays/friday";
import { HalloweenHtml } from "../controllers/holidays/halloween";
import { getCurrentHolidays } from "../controllers/holidays/holidayController";
import { ValentineHtml } from "../controllers/holidays/valentine";
import { getCurrentUser } from "../lib/store";
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
          <style>
            {`
              :root {
                /* Background */
                --color-bg-base: 15, 23, 42;
                --color-bg-gradient-from: 51, 65, 85;
                --color-bg-gradient-via: 30, 41, 59;
                --color-bg-gradient-to: 17, 24, 39;

                /* Surface (cards, panels, modals) */
                --color-surface: 30, 41, 59;
                --color-surface-elevated: 31, 41, 55;
                --color-surface-hover: 51, 65, 85;
                --color-surface-input: 71, 85, 105;

                /* Text */
                --color-text-primary: 255, 255, 255;
                --color-text-secondary: 209, 213, 219;
                --color-text-muted: 156, 163, 175;
                --color-text-subtle: 107, 114, 128;
                --color-text-disabled: 75, 85, 99;

                /* Border */
                --color-border-default: 55, 65, 81;
                --color-border-light: 100, 116, 139;
                --color-border-input: 75, 85, 99;
                --color-border-input-light: 209, 213, 219;

                /* Primary */
                --color-primary: 255, 137, 6;

                /* Semantic Colors */
                --color-action: 59, 130, 246;
                --color-action-hover: 37, 99, 235;
                --color-action-focus: 96, 165, 250;
                --color-action-dark: 30, 64, 175;

                --color-success: 15, 118, 110;

                --color-danger: 239, 68, 68;
                --color-danger-hover: 185, 28, 28;

                --color-warning: 250, 204, 21;
                --color-warning-hover: 253, 224, 71;

                /* Ring */
                --color-ring-black: 0, 0, 0;
                --color-ring-gray: 55, 65, 81;

                /* Border Radius */
                --radius-sm: 0.125rem;
                --radius-md: 0.375rem;
                --radius-lg: 0.5rem;
                --radius-xl: 0.75rem;
                --radius-full: 9999px;

                /* Shadows */
                --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

                /* Transitions */
                --transition-fast: 150ms;
                --transition-normal: 200ms;
                --transition-slow: 300ms;
              }
            `}
          </style>
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
