import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { syncIfLocal } from "../../../src/lib/dbHelpers.ts";
import { BoardMatchForm } from "../../components/BoardMatchForm";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { MatchSearchResults } from "../../components/MatchSearchResults";
import { NavbarHtml } from "../../components/Navbar";
import { TraySearchResults } from "../../components/TraySearchResults";
import { ctx } from "../../context";
import { execute_webhooks } from "../../controllers/webhookController";
import { getMatch, getMatchesBeforeDate } from "../../db/queries/matchQueries";
import { getActiveSeason } from "../../db/queries/seasonQueries";
import {
  listRecentlyActiveUsers,
  listUsersByName,
} from "../../db/queries/userQueries";
import { matches, questTbl, ratingEventTbl } from "../../db/schema";
import { redirect } from "../../lib";
import { addMatchSummary } from "../../lib/addMatchSummary";
import { normalizeLogMatchBody } from "../../lib/logMatchBody";
import { handleQuestsAfterLoggedMatch } from "../../lib/quest";
import { toInsertRatingEvent } from "../../lib/ratingEvent";
import { getCurrentUser } from "../../lib/store.ts";
import { isDefined } from "../../lib/utils";

export const match = new Elysia({
  prefix: "/match",
})
  .use(ctx)
  .onBeforeHandle(({ headers, set }) => {
    const user = getCurrentUser();
    if (!user) {
      redirect({ set, headers }, "/api/auth/signin/azure");
      return true;
    }
  })
  .get("/", async ({ html, headers }) => {
    return html(() => MatchPage(headers));
  })
  .get(
    "/search",
    async ({ html, query: { name, includeEmail, target } }) => {
      if (target === "tray") {
        const results = name
          ? await listUsersByName(name, 5)
          : await listRecentlyActiveUsers(8);
        return html(() => TraySearchResults({ results }));
      }

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
          target: t.String({ enum: ["tray"] }),
        }),
      ),
    },
  )
  .post(
    "/",
    async ({ headers, set, body, writeDb }) => {
      const normalized = normalizeLogMatchBody(body);
      if (!normalized.ok) {
        return new Response(
          `<div id="errors" class="text-red-500">${normalized.error}</div>`,
          {
            status: 400,
          },
        );
      }

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
        ...normalized.match,
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

      await syncIfLocal();

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
      body: t.Object({
        seatN: t.Optional(t.String()),
        seatE: t.Optional(t.String()),
        seatS: t.Optional(t.String()),
        seatW: t.Optional(t.String()),
        winner: t.Optional(
          t.Enum({
            NS: "NS",
            EW: "EW",
            Draw: "Draw",
            N: "N",
            E: "E",
            S: "S",
            W: "W",
          }),
        ),
        point_difference: t.String({ minLength: 1 }),
      }),
    },
  );

function MatchPage(headers: Record<string, string | null>) {
  return <LayoutHtml headers={headers}>{LogMatchPage()}</LayoutHtml>;
}

function LogMatchPage() {
  return (
    <>
      <NavbarHtml activePage="match" />
      <HeaderHtml title="Log match" />
      <BoardMatchForm formId="board-match-form" />
    </>
  );
}
