import { type PropsWithChildren } from "@kitajs/html";
import { getIsItChristmas } from "../controllers/christmas";
import { BokehLightsHtml, SideLightsHtml } from "./FancyLights";
import { GitHubLinkHtml } from "./GitHubLink";
import { LoadingBarHtml } from "./LoadingBar";

export const BaseHtml = ({ children }: PropsWithChildren) => {
  const isItChristmas = getIsItChristmas();
  const snowflakeCount = new Date().getDate() * 10;
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
            <>
              <style>
                {`
                /* https://pajasevi.github.io/CSSnowflakes/ */
                .snowflake {
                  color: #fff;
                  font-size: 1em;
                  font-family: Arial, sans-serif;
                  text-shadow: 0 0 5px #000;
                }
                
                .snowflake, .snowflake .inner {
                  animation-iteration-count: infinite;
                  animation-play-state: running;
                }
                
                @keyframes snowflakes-fall {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(110vh); }
                }
                
                @keyframes snowflakes-shake {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(80px); }
                }
                
                .snowflake {
                  position: fixed;
                  top: -10%;
                  z-index: 9999;
                  -webkit-user-select: none;
                  user-select: none;
                  cursor: default;
                  pointer-events: none;
                  animation-name: snowflakes-shake;
                  animation-duration: 3s;
                  animation-timing-function: ease-in-out;
                }
                
                .snowflake .inner {
                  animation-duration: 10s;
                  animation-name: snowflakes-fall;
                  animation-timing-function: linear;
                }
                
                ${Array.from({ length: snowflakeCount }).map((_, i) => `
                  .snowflake:nth-of-type(${i + 1}) {
                  left: ${Math.random() * 100}%;
                  animation-delay: ${Math.random() * 3}s;
                  top: ${-10 - Math.random() * 50}%; /* Varied starting heights */
                  }
                  .snowflake:nth-of-type(${i + 1}) .inner {
                    animation-delay: ${-Math.random() * 10}s; /* Start at random points in animation */
                  }
                `).join('')}
            
            `}
              </style>
              <script src="https://www.youtube.com/iframe_api"></script>
            </>
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
          <div style="position: relative; z-index: 10">{children}</div>

          <GitHubLinkHtml />
          {isItChristmas && (
            <>
              <SideLightsHtml />
              <div
                class="fixed bottom-4 left-4 hidden rounded-full bg-slate-700 p-2 transition-colors hover:bg-slate-600 lg:block"
                _="on click remove #christmas-music then remove me"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  class="text-white"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M1.5 5h2.79l3.86-3.83.85.35v13l-.85.33L4.29 11H1.5l-.5-.5v-5l.5-.5zm3.35 5.17L8 13.31V2.73L4.85 5.85 4.5 6H2v4h2.5l.35.17zm9.381-4.108l.707.707L13.207 8.5l1.731 1.732-.707.707L12.5 9.207l-1.732 1.732-.707-.707L11.793 8.5 10.06 6.77l.707-.707 1.733 1.73 1.731-1.731z"
                  />
                </svg>
              </div>
              <div class="snowflakes" aria-hidden="true">
                {Array.from({ length: snowflakeCount }).map(() => (
                  <div class="snowflake">
                    <div class="inner">❅</div>
                  </div>
                ))}
              </div>
              <BokehLightsHtml />
              <iframe
                id="christmas-music"
                width="0"
                height="0"
                src="https://www.youtube.com/embed/RmUWWVZw28E?autoplay=1"
                frameborder="0"
                allow="autoplay"
                referrerpolicy="strict-origin-when-cross-origin"
              ></iframe>
            </>
          )}
        </body>
      </html>
    </>
  );
};
