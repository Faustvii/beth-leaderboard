import { SideLightsHtml, SoftGlowingLightsHtml } from "./FancyLights";

export function getIsItChristmas() {
  return process.env.IS_CHRISTMAS === "true";
}

export function updateIsItChristmas() {
  // getMonth is zero indexed
  if (new Date().getMonth() === 11) {
    process.env.IS_CHRISTMAS = "true";
  } else {
    process.env.IS_CHRISTMAS = "false";
  }
}

const christmasColors = [
  "#f2b424", // gold
  "#ffffff", // white
];

export const ChristmasHtml = ({ renderLayer }: { renderLayer?: string }) => {
  const musicVideos = [
    "RmUWWVZw28E", // (All i want for christmas is you)
    "QJ5DOWPGxwg", // (its beginning to look a lot like christmas)
    "E8gmARGvPlI", // (Last Christmas)
  ];

  const randomVideo =
    musicVideos[Math.floor(Math.random() * musicVideos.length)];
  const snowflakeCount =
    new Date().getDate() * 10 > 140 ? 150 : new Date().getDate() * 10;

  if (renderLayer === "background") {
    return (
      <>
        <SoftGlowingLightsHtml colors={christmasColors} />
        <SideLightsHtml colors={christmasColors} />
      </>
    );
  }

  if (renderLayer === "effects") {
    return (
      <>
        <style>
          {`
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

              user-select: none;
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

            ${Array.from({ length: snowflakeCount })
              .map(
                (_, i) => `
                .snowflake:nth-of-type(${i + 1}) {
                  left: ${Math.random() * 100}%;
                  animation-delay: ${Math.random() * 3}s;
                  top: ${-10 - Math.random() * 50}%;
                }
                .snowflake:nth-of-type(${i + 1}) .inner {
                  animation-delay: ${-Math.random() * 10}s;
                }
              `,
              )
              .join("")}
          `}
        </style>

        {/* mute button */}
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
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.5 5h2.79l3.86-3.83.85.35v13l-.85.33L4.29 11H1.5l-.5-.5v-5l.5-.5zm3.35 5.17L8 13.31V2.73L4.85 5.85 4.5 6H2v4h2.5l.35.17zm9.381-4.108l.707.707L13.207 8.5l1.731 1.732-.707.707L12.5 9.207l-1.732 1.732-.707-.707L11.793 8.5 10.06 6.77l.707-.707 1.733 1.73 1.731-1.731z"
            />
          </svg>
        </div>

        {/* music */}
        <iframe
          id="christmas-music"
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${randomVideo}?autoplay=1`}
          frameborder="0"
          allow="autoplay"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>

        {/* snowflakes */}
        <div class="snowflakes" aria-hidden="true">
          {Array.from({ length: snowflakeCount }).map(() => (
            <div class="snowflake">
              <div class="inner">❅</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
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
              user-select: none;
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

            ${Array.from({ length: snowflakeCount })
              .map(
                (_, i) => `
                .snowflake:nth-of-type(${i + 1}) {
                  left: ${Math.random() * 100}%;
                  animation-delay: ${Math.random() * 3}s;
                  top: ${-10 - Math.random() * 50}%;
                }
                .snowflake:nth-of-type(${i + 1}) .inner {
                  animation-delay: ${-Math.random() * 10}s;
                }
              `,
              )
              .join("")}
          `}
      </style>
      <SoftGlowingLightsHtml colors={christmasColors} />
      <SideLightsHtml colors={christmasColors} />

      {/* mute button */}
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
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M1.5 5h2.79l3.86-3.83.85.35v13l-.85.33L4.29 11H1.5l-.5-.5v-5l.5-.5zm3.35 5.17L8 13.31V2.73L4.85 5.85 4.5 6H2v4h2.5l.35.17zm9.381-4.108l.707.707L13.207 8.5l1.731 1.732-.707.707L12.5 9.207l-1.732 1.732-.707-.707L11.793 8.5 10.06 6.77l.707-.707 1.733 1.73 1.731-1.731z"
          />
        </svg>
      </div>

      {/* music */}
      <iframe
        id="christmas-music"
        width="0"
        height="0"
        src={`https://www.youtube.com/embed/${randomVideo}?autoplay=1`}
        frameborder="0"
        allow="autoplay"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>

      {/* snowflakes */}
      <div class="snowflakes" aria-hidden="true">
        {Array.from({ length: snowflakeCount }).map(() => (
          <div class="snowflake">
            <div class="inner">❅</div>
          </div>
        ))}
      </div>
    </>
  );
};
