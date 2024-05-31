import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { StatsCardHtml } from "../../components/StatsCard";
import { ctx } from "../../context";
import { deleteMatch, getMatches } from "../../db/queries/matchQueries";
import { getActiveSeason } from "../../db/queries/seasonQueries";
import { isHxRequest, redirect } from "../../lib";
import { MatchCard } from "./matchCard";

export const Admin = new Elysia({
  prefix: "/admin",
})
  .use(ctx)
  .onBeforeHandle(({ session, headers, set, userRoles }) => {
    if (!session || !session.user) {
      redirect({ set, headers }, "/api/auth/signin/azure");
      return true;
    }
    if (!userRoles.includes("admin")) {
      redirect({ set, headers }, "/");
      return true;
    }
  })
  .get("/", async ({ html, session, headers }) => {
    return html(() => adminPage(session, headers));
  })
  .delete("/match/:id", async ({ params: { id } }) => {
    console.log(id);
    await deleteMatch(parseInt(id));
    return;
  });

async function adminPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(session)
      ) : (
        <LayoutHtml>{page(session)}</LayoutHtml>
      )}
    </>
  );
}

async function page(session: Session | null) {
  const activeSeason = await getActiveSeason();
  // Fallback to first season if activeSeason is undefined :shrug:
  const matchesWithPlayers = await getMatches(activeSeason?.id ?? 0);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="With great power comes great responsibility" />
      <StatsCardHtml title="Latest games" doubleSize>
        <div class="flex w-full flex-col flex-wrap justify-between lg:flex-row">
          {globalMatchHistory.length !== 0 ? (
            globalMatchHistory.map((match) => <MatchCard match={match} />)
          ) : (
            <span class="text-sm">No matches yet</span>
          )}
        </div>
      </StatsCardHtml>
    </>
  );
}
