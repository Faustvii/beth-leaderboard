import { type PropsWithChildren } from "@kitajs/html";

export const MainContainer = ({ children }: PropsWithChildren) => (
  <div class="mx-auto flex max-w-screen-xl flex-col " id="mainContainer">
    {children}
  </div>
);
