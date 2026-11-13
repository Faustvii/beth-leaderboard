import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import {
  deleteMatch,
  getMatch,
  getMatches,
} from "../../db/queries/matchQueries";
import { matches } from "../../db/schema";
import { allTimeSeason } from "../../db/schema/season";
import { redirect } from "../../lib";
import { fromTimezoneToUTC } from "../../lib/dateUtils";
import { getCurrentUser } from "../../lib/store";
import { EditMatchModal } from "./components/EditMatchModal";
import { MatchCard } from "./components/MatchCard";

export const Match = new Elysia({
  prefix: "/match",
})
  .use(ctx)
  .get("/", async ({ html, headers }) => {
    return html(() => matchPage(headers));
  })
  .get("/:id", async ({ params: { id } }) => {
    const user = getCurrentUser();
    const matchToEdit = await getMatch(Number(id), !!user);
    if (!matchToEdit) return;
    return <EditMatchModal match={matchToEdit} />;
  })
  .put(
    "/",
    async ({ set, headers, body, writeDb }) => {
      const createdAtFromUser = new Date(
        `${body.date_played}T${body.time_played}`,
      );
      if (Number.isNaN(createdAtFromUser.getTime())) {
        return new Response(
          `<div id="errors" class="text-red-500">Invalid date or time</div>`,
          { status: 400 },
        );
      }
      // Positions can only be recorded for a 2v2; the columns then stand for
      // seats 1/3 (white) and 2/4 (black).
      const isDoubles = !!body.white2Id && !!body.black2Id;
      const positionsRecorded = body.positions_recorded === "true";
      if (positionsRecorded && !isDoubles) {
        return new Response(
          `<div id="errors" class="text-red-500">Positions can only be recorded for a 2v2 match</div>`,
          { status: 400 },
        );
      }
      const createdAt = fromTimezoneToUTC(
        createdAtFromUser,
        "Europe/Copenhagen",
      );

      await writeDb
        .update(matches)
        .set({
          whitePlayerOne: body.white1Id,
          whitePlayerTwo: body.white2Id,
          blackPlayerOne: body.black1Id,
          blackPlayerTwo: body.black2Id,
          result: body.match_winner,
          scoreDiff: Number(body.point_difference),
          createdAt,
          positionsRecorded,
        })
        .where(eq(matches.id, Number(body.match_id)));

      redirect({ headers, set }, `/admin/match`);
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
        ].filter((id) => !!id);

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
        date_played: t.String(),
        time_played: t.String(),
        positions_recorded: t.Optional(t.String()),
      }),
    },
  )
  .delete("/:id", async ({ params: { id } }) => {
    await deleteMatch(parseInt(id));
    return page();
  });

export async function matchPage(headers: Record<string, string | null>) {
  return <LayoutHtml headers={headers}>{page()}</LayoutHtml>;
}

async function page() {
  const user = getCurrentUser();
  const matchesWithPlayers = await getMatches(allTimeSeason, !!user);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml activePage="admin" />
      <HeaderHtml title="Latest games" />
      <div class="flex w-full flex-col flex-wrap justify-between lg:flex-row">
        {globalMatchHistory.length !== 0 ? (
          globalMatchHistory.map((match) => <MatchCard match={match} />)
        ) : (
          <span class="text-sm">No matches yet</span>
        )}
      </div>
    </>
  );
}
