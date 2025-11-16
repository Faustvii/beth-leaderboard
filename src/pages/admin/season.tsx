import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import {
  deleteSeason,
  getSeason,
  getSeasons,
} from "../../db/queries/seasonQueries";
import { seasonsTbl } from "../../db/schema/index";
import { ratingSystemTypes } from "../../db/schema/season";
import { isHxRequest, redirect } from "../../lib";
import { syncIfLocal } from "../../lib/dbHelpers";
import { EditSeasonModal } from "./components/EditSeasonModal";
import { ExistingSeasons } from "./components/ExistingSeasons";
import { SeasonForm } from "./components/SeasonForm";

const ratingSystemTypesEnum = t.Enum(
  Object.fromEntries(ratingSystemTypes.map((type) => [type, type])),
);

export const Season = new Elysia({
  prefix: "/season",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => seasonPage(session, headers));
  })
  .get(":id", async ({ params: { id } }) => {
    const seasonToEdit = await getSeason(Number(id));

    if (!seasonToEdit) return;

    return <EditSeasonModal season={seasonToEdit} />;
  })
  .put(
    "/",
    async ({ set, headers, body, writeDb }) => {
      await writeDb
        .update(seasonsTbl)
        .set({
          name: body.seasonName,
          startAt: new Date(body.seasonStart),
          endAt: new Date(body.seasonEnd),
          ratingSystem: body.ratingSystem,
          ratingEventSystem: body.ratingEventSystem,
        })
        .where(eq(seasonsTbl.id, Number(body.seasonId)));

      redirect({ headers, set }, `/admin/season`);
    },
    {
      body: t.Object({
        seasonId: t.String(),
        seasonName: t.String({ minLength: 1 }),
        seasonStart: t.String({ minLength: 1 }),
        seasonEnd: t.String({ minLength: 1 }),
        ratingSystem: ratingSystemTypesEnum,
        ratingEventSystem: t.Enum({ none: "none", quest: "quest" }),
      }),
    },
  )
  .post(
    "/",
    async ({ set, headers, body, writeDb }) => {
      type newSeason = typeof seasonsTbl.$inferInsert;
      const seasonToInsert: newSeason = {
        name: body.seasonName,
        startAt: new Date(body.seasonStart),
        endAt: new Date(body.seasonEnd),
        ratingSystem: body.ratingSystem,
        ratingEventSystem: body.ratingEventSystem,
      };

      await writeDb.insert(seasonsTbl).values(seasonToInsert);
      await syncIfLocal();

      redirect({ headers, set }, `/admin/season`);
    },
    {
      beforeHandle: ({ body }) => {
        const startDate = new Date(body.seasonStart);
        const endDate = new Date(body.seasonEnd);
        const now = new Date(Date.now());

        if (startDate > endDate) {
          return new Response(
            `<div id="errors" class="text-red-500">Start date must be before end date</div>`,
            {
              status: 400,
            },
          );
        }
        if (startDate < now || endDate < now) {
          return new Response(
            `<div id="errors" class="text-red-500">The new season must in the future</div>`,
            {
              status: 400,
            },
          );
        }
        return;
      },
      body: t.Object({
        seasonName: t.String({ minLength: 1 }),
        seasonStart: t.String({ minLength: 1 }),
        seasonEnd: t.String({ minLength: 1 }),
        ratingSystem: ratingSystemTypesEnum,
        ratingEventSystem: t.Enum({ none: "none", quest: "quest" }),
      }),
    },
  )

  .delete(":id", async ({ params: { id }, session }) => {
    await deleteSeason(parseInt(id));
    return page(session);
  });

async function seasonPage(
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
  const seasons = await getSeasons();

  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="Seasons" />

      <div class="flex w-full flex-col gap-3">
        <ExistingSeasons seasons={seasons} />
        <SeasonForm
          formId="newSeason"
          actionButtons={
            <button
              hx-post="/admin/season"
              hx-indicator=".progress-bar"
              class="ml-auto mt-4 h-10 w-full min-w-[180px] rounded-lg bg-teal-700 p-2 px-4 lg:mt-auto"
              type="button"
            >
              Create new Season
            </button>
          }
          amountOfSeasons={seasons.length}
        />
      </div>
    </>
  );
}
