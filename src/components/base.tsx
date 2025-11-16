import { type PropsWithChildren } from "@kitajs/html";
import { getIsItChristmas } from "../controllers/christmas";
import { GitHubLinkHtml } from "./GitHubLink";
import { LoadingBarHtml } from "./LoadingBar";

export const BaseHtml = ({ children }: PropsWithChildren) => {
  const isItChristmas = getIsItChristmas();
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
          {isItChristmas && (
            <style>
              {`
          /* https://pajasevi.github.io/CSSnowflakes/ */
          .snowflake {
            color: #fff;
            font-size: 1em;
            font-family: Arial, sans-serif;
            text-shadow: 0 0 5px #000;
            }
          
          .snowflake,.snowflake .inner{animation-iteration-count:infinite;animation-play-state:running}@keyframes snowflakes-fall{0%{transform:translateY(0)}100%{transform:translateY(110vh)}}@keyframes snowflakes-shake{0%,100%{transform:translateX(0)}50%{transform:translateX(80px)}}.snowflake{position:fixed;top:-10%;z-index:9999;-webkit-user-select:none;user-select:none;cursor:default;pointer-events:none;animation-name:snowflakes-shake;animation-duration:3s;animation-timing-function:ease-in-out}.snowflake .inner{animation-duration:10s;animation-name:snowflakes-fall;animation-timing-function:linear}.snowflake:nth-of-type(0){left:1%;animation-delay:0s}.snowflake:nth-of-type(0) .inner{animation-delay:0s}.snowflake:first-of-type{left:10%;animation-delay:1s}.snowflake:first-of-type .inner,.snowflake:nth-of-type(8) .inner{animation-delay:1s}.snowflake:nth-of-type(2){left:20%;animation-delay:.5s}.snowflake:nth-of-type(2) .inner,.snowflake:nth-of-type(6) .inner{animation-delay:6s}.snowflake:nth-of-type(3){left:30%;animation-delay:2s}.snowflake:nth-of-type(11) .inner,.snowflake:nth-of-type(3) .inner{animation-delay:4s}.snowflake:nth-of-type(4){left:40%;animation-delay:2s}.snowflake:nth-of-type(10) .inner,.snowflake:nth-of-type(4) .inner{animation-delay:2s}.snowflake:nth-of-type(5){left:50%;animation-delay:3s}.snowflake:nth-of-type(5) .inner{animation-delay:8s}.snowflake:nth-of-type(6){left:60%;animation-delay:2s}.snowflake:nth-of-type(7){left:70%;animation-delay:1s}.snowflake:nth-of-type(7) .inner{animation-delay:2.5s}.snowflake:nth-of-type(8){left:80%;animation-delay:0s}.snowflake:nth-of-type(9){left:90%;animation-delay:1.5s}.snowflake:nth-of-type(9) .inner{animation-delay:3s}.snowflake:nth-of-type(10){left:25%;animation-delay:0s}.snowflake:nth-of-type(11){left:65%;animation-delay:2.5s}
          `}
            </style>
          )}
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
        text-white
    "
        >
          <LoadingBarHtml />
          {children}
          <GitHubLinkHtml />
          {isItChristmas && (
            <div class="snowflakes" aria-hidden="true">
              {Array.from({ length: 12 }).map(() => (
                <div class="snowflake">
                  <div class="inner">❅</div>
                </div>
              ))}
            </div>
          )}
        </body>
      </html>
    </>
  );
};
