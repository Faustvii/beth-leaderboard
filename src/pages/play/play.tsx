import { Elysia } from "elysia";
import { type Session } from "lucia";
import { AnchorButtonHtml } from "../../components/Button";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import { isHxRequest, redirect } from "../../lib";

export const play = new Elysia({
  prefix: "/play",
})
  .use(ctx)
  .onBeforeHandle(({ session, headers, set }) => {
    if (!session || !session.user) {
      redirect({ set, headers }, "/api/auth/signin/azure");
      return true;
    }
  })
  .get("/", ({ session, headers }) => PlayPage(session, headers))
  .get("/1v1", () => OneVsOne())
  .get("/2v2", () => TwoVsTwo());

function OneVsOne() {
  return (
    <div class="flex flex-col" hx-ext="ws" ws-connect="/play/queue/1v1">
      <div id="queue-status"></div>
    </div>
  );
}

function TwoVsTwo() {
  return (
    <div class="flex flex-col" hx-ext="ws" ws-connect="/play/queue/2v2">
      <div id="queue-status"></div>
    </div>
  );
}

export async function PlayPage(session: Session | null, headers: ElysiaHeader) {
  return (
    <>
      {isHxRequest(headers) ? (
        MatchMakePage(session)
      ) : (
        <LayoutHtml>{MatchMakePage(session)}</LayoutHtml>
      )}
    </>
  );
}

function MatchMakePage(session: Session | null) {
  return (
    <>
      <NavbarHtml session={session} activePage="play" />
      <HeaderHtml title="Play" />
      <div class="flex flex-col items-center justify-center">
        <h1 class="p-4 text-2xl font-semibold text-white">
          What would you like to queue for?
        </h1>
        <div class="flex-row justify-between">
          <AnchorButtonHtml hx-get="/play/1v1" hx-target="#queue">
            1v1
          </AnchorButtonHtml>
          <AnchorButtonHtml hx-get="/play/2v2" hx-target="#queue">
            2v2
          </AnchorButtonHtml>
        </div>
        <div id="queue" class="flex-row justify-between"></div>
      </div>
    </>
  );
}
