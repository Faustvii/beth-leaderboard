import { type PropsWithChildren } from "@kitajs/html";
import { isHxRequest } from "../lib";
import { BaseHtml } from "./base";
import { MainContainer } from "./MainContainer";

type LayoutProps = PropsWithChildren & {
  headers: Record<string, string | null>;
  showFestivities?: boolean;
};

export const LayoutHtml = ({
  children,
  headers,
  showFestivities,
}: LayoutProps) => {
  return (
    <>
      {isHxRequest(headers) ? (
        <MainContainer>{children}</MainContainer>
      ) : (
        <BaseHtml showFestivities={showFestivities}>
          <MainContainer>{children}</MainContainer>
        </BaseHtml>
      )}
    </>
  );
};
