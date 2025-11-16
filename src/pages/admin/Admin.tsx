import { Elysia } from "elysia";
import { type Session } from "lucia";
import { ActionCard } from "../../components/ActionCard";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import { isHxRequest, redirect } from "../../lib";
import { GuestUser } from "./guest-user";
import { Match } from "./match";
import { MergeUsers } from "./merge-users";
import { Season } from "./season";

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
  .use(Season)
  .use(GuestUser)
  .use(Match)
  .use(MergeUsers)
  .get("/", async ({ html, session, headers }) => {
    return html(() => adminPage(session, headers));
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
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="With great power comes great responsibility" />
      <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        <ActionCard title="Manage Seasons" icon="🗓️" action="/admin/season">
          Start a new season or manage and configure settings.
        </ActionCard>
        <ActionCard
          title="Create Guest User"
          icon="👤"
          action="/admin/guest-user"
        >
          Add a temporary or limited-access user.
        </ActionCard>
        <ActionCard title="Edit Previous Match" icon="⚽" action="/admin/match">
          Update match results, scores, or details.
        </ActionCard>
        <ActionCard title="Merge Users" icon="🔗" action="/admin/merge-users">
          Combine duplicate user accounts.
        </ActionCard>
      </div>
    </>
  );
}
