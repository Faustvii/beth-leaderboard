import { type PropsWithChildren } from "@kitajs/html";
import { BaseHtml } from "./base";
import { MainContainer } from "./MainContainer";

export const LayoutHtml = ({ children }: PropsWithChildren) => (
  <BaseHtml>
    <MainContainer>{children}</MainContainer>
  </BaseHtml>
);
