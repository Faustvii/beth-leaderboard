import { SideLightsHtml, SoftGlowingLightsHtml } from "./FancyLights";

export function getIsItHalloween() {
  return process.env.IS_HALLOWEEN === "true";
}

export function updateIsItHalloween() {
  // getMonth is zero indexed
  if (new Date().getMonth() === 8) {
    process.env.IS_HALLOWEEN = "true";
  } else {
    process.env.IS_HALLOWEEN = "false";
  }
}

export const HalloweenHtml = ({renderLayer}: {renderLayer?: string}) => {

  const musicVideos = [
    "ZVuToMilP0A", // (This is Halloween)
    "4V90AmXnguw", // (Thriller)
    "sVjk5nrb_lI",   // (spooky scary skeletons)
  ];

  const randomVideo = musicVideos[Math.floor(Math.random() * musicVideos.length)];

  const HalloweenColors = [
  '#FFFFFF',
  '#000',
  '#FFA100',
  '#FF5C00'
  ];


  if (renderLayer === "background") {
    return (
      <>
        <SoftGlowingLightsHtml colors={HalloweenColors} />
        <SideLightsHtml colors={HalloweenColors} />
      </>
    );
  }
  
   if (renderLayer === "effects") {
    return (
      <>
        <style>
        </style>
        {/* mute button */}
        <div
          class="fixed bottom-4 left-4 hidden rounded-full bg-slate-700 p-2 transition-colors hover:bg-slate-600 lg:block"
          _="on click remove #halloween-music then remove me"
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
          id="halloween-music"
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${randomVideo}?autoplay=1`}
          frameborder="0"
          allow="autoplay"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </>
    );
   };

   return (
    <>
      <SideLightsHtml colors={HalloweenColors} />
      <SoftGlowingLightsHtml colors={HalloweenColors} />
    </>
  );
};