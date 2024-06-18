import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { MatchForm } from "../../components/MatchForm";
import { NavbarHtml } from "../../components/Navbar";
import { StatsCardHtml } from "../../components/StatsCard";
import { ctx } from "../../context";
import {
  deleteMatch,
  getMatch,
  getMatches,
} from "../../db/queries/matchQueries";
import { getActiveSeason, getSeasons } from "../../db/queries/seasonQueries";
import { matches, seasonsTbl } from "../../db/schema";
import { isHxRequest, redirect } from "../../lib";
import { type Match } from "../../lib/rating";
import { cn } from "../../lib/utils";
import { MatchCard } from "./MatchCard";

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
  .delete("/match/:id", async ({ params: { id }, session }) => {
    await deleteMatch(parseInt(id));
    return page(session);
  })
  .get("/match/:id", async ({ params: { id } }) => {
    const matchToEdit = await getMatch(Number(id));

    if (!matchToEdit) return;

    return <EditMatchModal match={matchToEdit} />;
  })
  .post(
    "/",
    async ({ set, headers, body, writeDb }) => {
      await writeDb
        .update(matches)
        .set({
          whitePlayerOne: body.white1Id,
          whitePlayerTwo: body.white2Id,
          blackPlayerOne: body.black1Id,
          blackPlayerTwo: body.black2Id,
          result: body.match_winner,
          scoreDiff: Number(body.point_difference),
        })
        .where(eq(matches.id, Number(body.match_id)));

      redirect({ headers, set }, `/admin`);
    },
    {
      error({ code, error }) {
        switch (code) {
          case "VALIDATION":
            return new Response(
              `<div id="errors" class="text-red-500">${error.message}</div>`,
              {
                status: 400,
              },
            );
        }
      },
      beforeHandle: ({ body }) => {
        const userIds = [
          body.white1Id,
          body.white2Id,
          body.black1Id,
          body.black2Id,
        ].filter((id) => id !== "");

        const uniqueIds = new Set(userIds);
        if (uniqueIds.size !== userIds.length) {
          return new Response(
            `<div id="errors" class="text-red-500">The same player can't participate multiple times</div>`,
            {
              status: 400,
            },
          );
        }
        if (uniqueIds.size % 2 !== 0) {
          return new Response(
            `<div id="errors" class="text-red-500">The teams must have the same amount of players</div>`,
            {
              status: 400,
            },
          );
        }
        return;
      },
      transform({ body }) {
        const id = +body.match_id;
        const diff = +body.point_difference;

        if (!Number.isNaN(id)) body.match_id = id;
        if (!Number.isNaN(diff)) body.point_difference = diff;
      },
      body: t.Object({
        white1Id: t.String({ minLength: 1 }),
        white2Id: t.Optional(t.String()),
        black1Id: t.String({ minLength: 1 }),
        black2Id: t.Optional(t.String()),
        match_winner: t.Enum({
          White: "White",
          Black: "Black",
          Draw: "Draw",
        }),
        point_difference: t.Number({ minimum: 0, maximum: 960, multipleOf: 5 }),
        match_id: t.Number(),
      }),
    },
  )
  .post(
    "/new-season",
    async ({ set, headers, body, writeDb }) => {
      const newSeasonName = `Season ${body.currentSeasonId + 1}`;

      type newSeason = typeof seasonsTbl.$inferInsert;
      const seasonToInsert: newSeason = {
        name: newSeasonName,
        startAt: new Date(body.newSeasonStart),
        endAt: new Date(body.newSeasonEnd),
        ratingSystem: body.ratingSystem,
      };

      await writeDb.insert(seasonsTbl).values(seasonToInsert);

      redirect({ headers, set }, `/admin`);
    },
    {
      beforeHandle: ({ body }) => {
        const startDate = new Date(body.newSeasonStart);
        const endDate = new Date(body.newSeasonEnd);
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
      transform({ body }) {
        const currentSeasonId = +body.currentSeasonId;
        if (!Number.isNaN(currentSeasonId))
          body.currentSeasonId = currentSeasonId;
      },
      body: t.Object({
        newSeasonStart: t.String({ minLength: 1 }),
        newSeasonEnd: t.String({ minLength: 1 }),
        ratingSystem: t.Enum({ elo: "elo", openskill: "openskill" }),
        currentSeasonId: t.Number(),
      }),
    },
  );

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
  const seasons = await getSeasons();
  const activeSeason = await getActiveSeason();

  // Fallback to first season if activeSeason is undefined :shrug:
  const matchesWithPlayers = await getMatches(activeSeason?.id ?? 0);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="With great power comes great responsibility" />
      <StatsCardHtml title="Seasons" doubleSize>
        <div class="flex flex-col">
          <form
            id="newSeasonForm"
            method="post"
            enctype="multipart/form-data"
            hx-ext="response-targets"
            hx-target-400="#errors"
          >
            <label for="newSeasonStart">Start</label>
            <input
              id="newSeasonStart"
              name="newSeasonStart"
              form="newSeasonForm"
              class="text-black"
              type="datetime-local"
            />
            <label for="newSeasonEnd">End</label>
            <input
              id="newSeasonEnd"
              name="newSeasonEnd"
              form="newSeasonForm"
              class="text-black"
              type="datetime-local"
            />
            <label for="ratingSystemSelect">Rating system:</label>
            <select
              id="ratingSystemSelect"
              name="ratingSystem"
              form="newSeasonForm"
              class="text-black"
            >
              <option value="openskill">Openskill</option>
              <option value="elo">ELO</option>
            </select>
            <input
              hidden
              form="newSeasonForm"
              id="currenSeasonId"
              name="currentSeasonId"
              value={activeSeason?.id.toString()}
            />
            <button
              hx-post="/admin/new-season"
              hx-indicator=".progress-bar"
              class="rounded-lg bg-teal-700 p-2"
              type="button"
            >
              Create new Season
            </button>
            <div id="errors" class="text-red-500"></div>
          </form>
          <div>
            {seasons.map((season) => (
              <div>
                <p>{season.name}</p>
                <p>{season.startAt}</p>
                <p>{season.endAt}</p>
                <p>{season.ratingSystem}</p>
              </div>
            ))}
          </div>
        </div>
      </StatsCardHtml>
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

interface EditMatchModalProps {
  match: Match;
}

const EditMatchModal = ({ match }: EditMatchModalProps) => {
  return (
    <div
      id="edit-match-modal"
      class={cn(
        "fixed bottom-0 left-0 right-0 top-0 z-40 backdrop-brightness-50",
        "flex flex-col items-center justify-center",
        // TODO: Add animation
      )}
      _="on closeEditModal remove me"
    >
      <div
        class="absolute bottom-0 left-0 right-0 top-0 -z-50"
        _="on click trigger closeEditModal"
      />
      <div class="-z-20 w-[80%] max-w-[600px] rounded-md bg-slate-800 p-4 shadow-md lg:p-8">
        <h1 class="mb-4 text-2xl font-semibold">Edit match</h1>
        <MatchForm
          formId={`edit-match-${match.id}-form`}
          match={match}
          actionButtons={
            <div class="mt-3 flex justify-end gap-3">
              <button
                type="button"
                class="rounded-lg bg-red-700 p-2"
                _="on click trigger closeEditModal"
              >
                Cancel
              </button>
              <button
                hx-post="/admin"
                type="submit"
                class="rounded-lg bg-teal-700 p-2"
                hx-indicator=".progress-bar"
                _="on click set my.innerText to 'Saving...' then wait for htmx:afterRequest then set my.innerText to 'Save'"
              >
                Save
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
};
