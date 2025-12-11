import { type PropsWithChildren } from "@kitajs/html";
import { isHxRequest } from "../lib";
import { BaseHtml } from "./base";
import { MainContainer } from "./MainContainer";

type LayoutProps = PropsWithChildren & {
  headers: Record<string, string | null>;
};

export const LayoutHtml = ({ children, headers }: LayoutProps) => (
  <>
    {isHxRequest(headers) ? (
      children
    ) : (
      <BaseHtml>
        <MainContainer>{children}</MainContainer>
      </BaseHtml>
    )}
  </>
);
