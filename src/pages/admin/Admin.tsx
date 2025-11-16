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
  .use(MergeUsers)
  .get("/", async ({ html, session, headers }) => {
    return html(() => adminPage(session, headers));
  });
//   .get("/match/:id", async ({ params: { id }, session }) => {
//     const matchToEdit = await getMatch(Number(id), !!session?.user);

//     if (!matchToEdit) return;

//     return <EditMatchModal match={matchToEdit} />;
//   })
//   .get("/season/:id", async ({ params: { id } }) => {
//     const seasonToEdit = await getSeason(Number(id));

//     if (!seasonToEdit) return;

//     return <EditSeasonModal season={seasonToEdit} />;
//   })
//   .put(
//     "/match",
//     async ({ set, headers, body, writeDb }) => {
//       const createdAtFromUser = new Date(
//         `${body.date_played}T${body.time_played}`,
//       );
//       const createdAt = fromTimezoneToUTC(
//         createdAtFromUser,
//         "Europe/Copenhagen",
//       );

//       await writeDb
//         .update(matches)
//         .set({
//           whitePlayerOne: body.white1Id,
//           whitePlayerTwo: body.white2Id,
//           blackPlayerOne: body.black1Id,
//           blackPlayerTwo: body.black2Id,
//           result: body.match_winner,
//           scoreDiff: Number(body.point_difference),
//           createdAt,
//         })
//         .where(eq(matches.id, Number(body.match_id)));

//       redirect({ headers, set }, `/admin`);
//     },
//     {
//       error({ code, error }) {
//         switch (code) {
//           case "VALIDATION":
//             return new Response(
//               `<div id="errors" class="text-red-500">${error.message}</div>`,
//               {
//                 status: 400,
//               },
//             );
//         }
//       },
//       beforeHandle: ({ body }) => {
//         const userIds = [
//           body.white1Id,
//           body.white2Id,
//           body.black1Id,
//           body.black2Id,
//         ].filter((id) => id !== "");

//         const uniqueIds = new Set(userIds);
//         if (uniqueIds.size !== userIds.length) {
//           return new Response(
//             `<div id="errors" class="text-red-500">The same player can't participate multiple times</div>`,
//             {
//               status: 400,
//             },
//           );
//         }
//         if (uniqueIds.size % 2 !== 0) {
//           return new Response(
//             `<div id="errors" class="text-red-500">The teams must have the same amount of players</div>`,
//             {
//               status: 400,
//             },
//           );
//         }
//         return;
//       },
//       transform({ body }) {
//         const id = +body.match_id;
//         const diff = +body.point_difference;

//         if (!Number.isNaN(id)) body.match_id = id;
//         if (!Number.isNaN(diff)) body.point_difference = diff;
//       },
//       body: t.Object({
//         white1Id: t.String({ minLength: 1 }),
//         white2Id: t.Optional(t.String()),
//         black1Id: t.String({ minLength: 1 }),
//         black2Id: t.Optional(t.String()),
//         match_winner: t.Enum({
//           White: "White",
//           Black: "Black",
//           Draw: "Draw",
//         }),
//         point_difference: t.Number({ minimum: 0, maximum: 960, multipleOf: 5 }),
//         match_id: t.Number(),
//         date_played: t.String(),
//         time_played: t.String(),
//       }),
//     },
//   )
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
//   .delete("/match/:id", async ({ params: { id }, session }) => {
//     await deleteMatch(parseInt(id));
//     return page(session);
//   })
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
        <ActionCard title="Edit Previous Match" icon="⚽">
          Update match results, scores, or details.
        </ActionCard>
        <ActionCard title="Merge Users" icon="🔗" action="/admin/merge-users">
          Combine duplicate user accounts.
        </ActionCard>
      </div>
    </>
  );
}
