import { type PropsWithChildren } from "@kitajs/html";

export const MainContainer = ({ children }: PropsWithChildren) => (
  <div
    class="mx-auto flex max-w-screen-xl flex-col px-2 sm:px-6 lg:px-8 "
    id="mainContainer"
  >
    {children}
  </div>
);
