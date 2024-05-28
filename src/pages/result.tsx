import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";

export const matchResult = new Elysia({
  prefix: "/result",
})
  .use(ctx)
  .get("/:matchId", ({ html, params, session }) => {
    return html(page(session, params.matchId));
  });

async function page(session: Session | null, matchId: string | undefined) {
  return (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="result" />
      <HeaderHtml title="Match result" />
      {"hello world"}
      {matchId}
    </LayoutHtml>
  );
}
