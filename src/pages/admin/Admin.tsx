import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { generateRandomString } from "lucia/utils";
import { ActionCard } from "../../components/ActionCard";
import { FoldableCard } from "../../components/FoldableCard";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { StatsCardHtml } from "../../components/StatsCard";
import { ctx } from "../../context";
import {
  deleteMatch,
  getMatch,
  getMatches,
} from "../../db/queries/matchQueries";
import {
  deleteSeason,
  getSeason,
  getSeasons,
} from "../../db/queries/seasonQueries";
import { matches, seasonsTbl } from "../../db/schema";
import { userTbl, type User } from "../../db/schema/auth";
import { allTimeSeason, ratingSystemTypes } from "../../db/schema/season";
import { isHxRequest, redirect } from "../../lib";
import { fromTimezoneToUTC } from "../../lib/dateUtils";
import { syncIfLocal } from "../../lib/dbHelpers";
import { EditMatchModal } from "./components/EditMatchModal";
import { EditSeasonModal } from "./components/EditSeasonModal";
import { ExistingSeasons } from "./components/ExistingSeasons";
import { MatchCard } from "./components/MatchCard";
import { SeasonForm } from "./components/SeasonForm";
import { UserForm } from "./components/UserForm";
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
  .use(Match)
  .use(MergeUsers)
  .get("/", async ({ html, session, headers }) => {
    return html(() => adminPage(session, headers));
  });
//   .put(
//     "/guest-user",
//     async ({ set, headers, body: { name, nickname }, writeDb }) => {
//       const guestName = `${name} (Guest)`;
//       const userToInsert: Omit<User, "picture"> = {
//         id: generateRandomString(15),
//         name: guestName,
//         email: null,
//         roles: null,
//         nickname: nickname,
//       };

//       const [{ id: userId }] = await writeDb
//         .insert(userTbl)
//         .values(userToInsert)
//         .returning();
//       await syncIfLocal();

//       redirect({ headers, set }, `/profile/${userId}`);
//     },
//     {
//       beforeHandle: (_) => undefined,
//       body: t.Object({
//         name: t.String({ minLength: 1 }),
//         nickname: t.String({ minLength: 1 }),
//       }),
//     },
//   )

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
        <ActionCard title="Create Guest User" icon="👤">
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
