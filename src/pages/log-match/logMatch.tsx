import clsx from "clsx";
import { like } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { MatchForm } from "../../components/MatchForm";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import { getActiveSeason } from "../../db/queries/seasonQueries";
import { matches, userTbl } from "../../db/schema";
import { isHxRequest, redirect } from "../../lib";
import { syncIfLocal } from "../../lib/dbHelpers";

export const match = new Elysia({
  prefix: "/match",
})
  .use(ctx)
  .onBeforeHandle(({ session, headers, set }) => {
    if (!session || !session.user) {
      redirect({ set, headers }, "/api/auth/signin/azure");
      return true;
    }
  })
  .get("/", async ({ html, session, headers }) => {
    return html(() => MatchPage(session, headers));
  })
  .get(
    "/search",
    async ({ readDb, html, query: { name } }) => {
      if (name === "") return;
      const players = await readDb
        .select({ name: userTbl.name, id: userTbl.id })
        .from(userTbl)
        .limit(5)
        .where(like(userTbl.name, `%${name}%`));

      return html(() => matchSearchResults(players));
    },
    {
      query: t.Partial(
        t.Object({
          name: t.String(),
        }),
      ),
    },
  )
  .post(
    "/",
    async ({ headers, set, body, writeDb }) => {
      const { white1Id, white2Id, black1Id, black2Id } = body;
      const { match_winner, point_difference } = body;
      const activeSeason = await getActiveSeason();
      if (!activeSeason) {
        return new Response(
          `<div id="errors" class="text-red-500">There is no active season</div>`,
          {
            status: 400,
          },
        );
      }

      type newMatch = typeof matches.$inferInsert;

      const matchInsert: newMatch = {
        result: match_winner,
        scoreDiff: Number(point_difference),
        whitePlayerOne: white1Id,
        whitePlayerTwo: white2Id ? white2Id : null,
        blackPlayerOne: black1Id,
        blackPlayerTwo: black2Id ? black2Id : null,
        seasonId: activeSeason.id,
      };

      const insertResult = await writeDb.insert(matches).values(matchInsert);
      await syncIfLocal();

      const matchId = insertResult.lastInsertRowid;
      redirect({ headers, set }, `/result/${activeSeason.id}/${matchId}`);
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
        point_difference: t.String({ minLength: 1 }),
      }),
    },
  );

// TODO: Move to own file
export function matchSearchResults(results: { name: string; id: string }[]) {
  return (
    <>
      {results.map((result) => (
        <button
          id={result.id}
          class={clsx([
            "w-full p-3 pl-10 text-left hover:bg-primary/50 last:hover:rounded-b-lg",
            "focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/50 last:focus-visible:rounded-b-lg",
          ])}
          value={result.name}
          _="on click halt the event then add @hidden to the closest <div/> then put my value into the value of the previous <input/> from me then put my id into the value of the next <input/>"
        >
          {result.name}
        </button>
      ))}
    </>
  );
}

function MatchPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        LogMatchPage(session)
      ) : (
        <LayoutHtml>{LogMatchPage(session)}</LayoutHtml>
      )}
    </>
  );
}

function LogMatchPage(session: Session | null) {
  return (
    <>
      <NavbarHtml session={session} activePage="match" />
      <HeaderHtml title="Log match" />
      <MatchForm
        formId="log-match-form"
        actionButtons={
          <button
            hx-post="/match"
            type="submit"
            class="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
          >
            Submit match result
          </button>
        }
      />
    </>
  );
}
