import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
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
import { EditMatchModal } from "./components/EditMatchModal";
import { MatchCard } from "./components/MatchCard";

export const Match = new Elysia({
  prefix: "/match",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => matchPage(session, headers));
  })
  .get("/:id", async ({ params: { id }, session }) => {
    const matchToEdit = await getMatch(Number(id), !!session?.user);
    if (!matchToEdit) return;
    return <EditMatchModal match={matchToEdit} />;
  })
  .put(
    "/",
    async ({ set, headers, body, writeDb }) => {
      const createdAtFromUser = new Date(
        `${body.date_played}T${body.time_played}`,
      );
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
        date_played: t.String(),
        time_played: t.String(),
      }),
    },
  )
  .delete("/:id", async ({ params: { id }, session }) => {
    await deleteMatch(parseInt(id));
    return page(session);
  });

export async function matchPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return <LayoutHtml headers={headers}>{page(session)}</LayoutHtml>;
}

async function page(session: Session | null) {
  const matchesWithPlayers = await getMatches(allTimeSeason, !!session?.user);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
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
