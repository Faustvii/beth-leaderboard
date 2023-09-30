import { type PropsWithChildren } from "beth-stack/jsx";

export const HeaderHtml = ({ children }: PropsWithChildren) => (
  <>
    <h1 class=" bg-blue-500 p-5 text-center text-3xl font-bold text-white shadow-md">
      Leaderboard
    </h1>
    {children}
  </>
);
