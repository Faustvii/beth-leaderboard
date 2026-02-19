import { type PropsWithChildren } from "@kitajs/html";
import { isHxRequest } from "../lib";
import { BaseHtml } from "./base";
import { MainContainer } from "./MainContainer";

type LayoutProps = PropsWithChildren & {
  headers: Record<string, string | null>;
  showBackgroundLights?: boolean;
};

export const LayoutHtml = ({ children, headers, showBackgroundLights }: LayoutProps) => {
  return (
    <>
      {isHxRequest(headers) ? (
        <MainContainer>{children}</MainContainer>
      ) : (
        <BaseHtml showBackgroundLights={showBackgroundLights}>
          <MainContainer>{children}</MainContainer>
        </BaseHtml>
      )}
    </>
  );
};
