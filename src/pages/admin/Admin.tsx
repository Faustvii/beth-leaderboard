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
import { ExistingSeasons } from "./components/ExisitngSeasons";
import { MatchCard } from "./components/MatchCard";
import { SeasonForm } from "./components/SeasonForm";
import { UserForm } from "./components/UserForm";
import { Match } from "./match";
import { MergeUsers } from "./merge-users";

const ratingSystemTypesEnum = t.Enum(
  Object.fromEntries(ratingSystemTypes.map((type) => [type, type])),
);

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
  .use(Match)
  .use(MergeUsers)
  .get("/", async ({ html, session, headers }) => {
    return html(() => adminPage(session, headers));
  });
//   .get("/season/:id", async ({ params: { id } }) => {
//     const seasonToEdit = await getSeason(Number(id));

//     if (!seasonToEdit) return;

//     return <EditSeasonModal season={seasonToEdit} />;
//   })

//   .put(
//     "/season",
//     async ({ set, headers, body, writeDb }) => {
//       await writeDb
//         .update(seasonsTbl)
//         .set({
//           name: body.seasonName,
//           startAt: new Date(body.seasonStart),
//           endAt: new Date(body.seasonEnd),
//           ratingSystem: body.ratingSystem,
//           ratingEventSystem: body.ratingEventSystem,
//         })
//         .where(eq(seasonsTbl.id, Number(body.seasonId)));

//       redirect({ headers, set }, `/admin`);
//     },
//     {
//       body: t.Object({
//         seasonId: t.String(),
//         seasonName: t.String({ minLength: 1 }),
//         seasonStart: t.String({ minLength: 1 }),
//         seasonEnd: t.String({ minLength: 1 }),
//         ratingSystem: ratingSystemTypesEnum,
//         ratingEventSystem: t.Enum({ none: "none", quest: "quest" }),
//       }),
//     },
//   )
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
//   .post(
//     "/season",
//     async ({ set, headers, body, writeDb }) => {
//       type newSeason = typeof seasonsTbl.$inferInsert;
//       const seasonToInsert: newSeason = {
//         name: body.seasonName,
//         startAt: new Date(body.seasonStart),
//         endAt: new Date(body.seasonEnd),
//         ratingSystem: body.ratingSystem,
//         ratingEventSystem: body.ratingEventSystem,
//       };

//       await writeDb.insert(seasonsTbl).values(seasonToInsert);
//       await syncIfLocal();

//       redirect({ headers, set }, `/admin`);
//     },
//     {
//       beforeHandle: ({ body }) => {
//         const startDate = new Date(body.seasonStart);
//         const endDate = new Date(body.seasonEnd);
//         const now = new Date(Date.now());

//         if (startDate > endDate) {
//           return new Response(
//             `<div id="errors" class="text-red-500">Start date must be before end date</div>`,
//             {
//               status: 400,
//             },
//           );
//         }
//         if (startDate < now || endDate < now) {
//           return new Response(
//             `<div id="errors" class="text-red-500">The new season must in the future</div>`,
//             {
//               status: 400,
//             },
//           );
//         }
//         return;
//       },
//       body: t.Object({
//         seasonName: t.String({ minLength: 1 }),
//         seasonStart: t.String({ minLength: 1 }),
//         seasonEnd: t.String({ minLength: 1 }),
//         ratingSystem: ratingSystemTypesEnum,
//         ratingEventSystem: t.Enum({ none: "none", quest: "quest" }),
//       }),
//     },
//   )

//   .delete("/season/:id", async ({ params: { id }, session }) => {
//     await deleteSeason(parseInt(id));
//     return page(session);
//   });

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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <ActionCard title="Create New Season" icon="🗓️">
          Start a new season and configure settings.
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
