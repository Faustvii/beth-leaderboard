import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { MatchForm } from "../../components/MatchForm";
import { MatchSearchResults } from "../../components/MatchSearchResults";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import { execute_webhooks } from "../../controllers/webhookController";
import { getMatch, getMatchesBeforeDate } from "../../db/queries/matchQueries";
import { getActiveSeason } from "../../db/queries/seasonQueries";
import { listUsersByName } from "../../db/queries/userQueries";
import { matches, questTbl, ratingEventTbl } from "../../db/schema";
import { redirect } from "../../lib";
import { addMatchSummary } from "../../lib/addMatchSummary";
import { handleQuestsAfterLoggedMatch } from "../../lib/quest";
import { toInsertRatingEvent } from "../../lib/ratingEvent";
import { isDefined } from "../../lib/utils";

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
    async ({ html, query: { name, includeEmail } }) => {
      if (!name || name === "") return;
      const results = await listUsersByName(name, 5);

      const includeEmailBoolean = isDefined(includeEmail)
        ? includeEmail === "true"
        : undefined;

      return html(() =>
        MatchSearchResults({ results, includeEmail: includeEmailBoolean }),
      );
    },
    {
      query: t.Partial(
        t.Object({
          name: t.String(),
          includeEmail: t.String({ enum: ["true", "false"] }),
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
        createdAt: new Date(),
      };

      const matchId = await writeDb.transaction(async (trans) => {
        const insertResult = await trans.insert(matches).values(matchInsert);

        const matchesForQuests = await getMatchesBeforeDate(
          activeSeason.id,
          matchInsert.createdAt,
          true,
          trans,
        );

        const completedQuests =
          await handleQuestsAfterLoggedMatch(matchesForQuests);

        console.log("Completed quests: ", completedQuests.length);
        for (const quest of completedQuests) {
          const questEvent = quest.reward();
          await trans
            .update(questTbl)
            .set({ resolvedAt: matchInsert.createdAt })
            .where(eq(questTbl.id, quest.id));
          await trans
            .insert(ratingEventTbl)
            .values(toInsertRatingEvent(questEvent, activeSeason.id));
        }

        return Number(insertResult.lastInsertRowid);
      });

      const completeMatch = await getMatch(matchId, true);
      if (completeMatch) {
        const MatchWithSummary = addMatchSummary(completeMatch);
        execute_webhooks("match", MatchWithSummary).catch(console.error);
      }

      redirect({ headers, set }, `/result/${matchId}`);
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

function MatchPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return <LayoutHtml headers={headers}>{LogMatchPage(session)}</LayoutHtml>;
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
            class="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
          >
            Submit match result
          </button>
        }
      />
    </>
  );
}
