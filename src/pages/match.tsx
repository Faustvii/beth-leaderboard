import { eq, inArray, like } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { SearchHtml } from "../components/Search";
import { ctx } from "../context";
import { matches, user } from "../db/schema";
import { isHxRequest, notEmpty, redirect } from "../lib";
import { syncIfLocal } from "../lib/dbHelpers";
import { applyMatchResult, matchEloChange } from "../lib/elo";
import { type GameResult } from "../types/elo";

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
    const isFirefoxMobile =
      headers["user-agent"]?.includes("Firefox") &&
      headers["user-agent"]?.includes("Mobile");
    return html(() => MatchPage(session, headers, isFirefoxMobile));
  })
  .get(
    "/search",
    async ({ readDb, html, query: { name } }) => {
      const players = await readDb
        .select({ name: user.name, id: user.id })
        .from(user)
        .limit(10)
        .where(like(user.name, `%${name}%`));

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
    async ({ html, body, readDb, writeDb }) => {
      const { white1Id, white2Id, black1Id, black2Id } = body;
      const { match_winner, point_difference } = body;

      const playerArray = [white1Id, white2Id, black1Id, black2Id].filter(
        notEmpty,
      );
      const players = await readDb.query.user.findMany({
        where: inArray(user.id, playerArray),
        columns: {
          id: true,
          elo: true,
        },
      });

      const whiteTeam = players.filter(
        (player) => player.id === white1Id || player.id === white2Id,
      );
      const blackTeam = players.filter(
        (player) => player.id === black1Id || player.id === black2Id,
      );

      const match: GameResult = {
        outcome: mapMatchOutcome(match_winner),
        teams: [
          { color: "White", players: whiteTeam },
          { color: "Black", players: blackTeam },
        ],
      };

      const eloChange = matchEloChange(match);
      applyMatchResult({ eloFloor: 0 }, match);

      type newMatch = typeof matches.$inferInsert;
      const matchInsert: newMatch = {
        result: match_winner,
        scoreDiff: Number(point_difference),
        whiteEloChange: eloChange.white,
        blackEloChange: eloChange.black,
        whitePlayerOne: white1Id,
        whitePlayerTwo: white2Id ? white2Id : null,
        blackPlayerOne: black1Id,
        blackPlayerTwo: black2Id ? black2Id : null,
      };

      await writeDb.transaction(async (trx) => {
        await trx.insert(matches).values(matchInsert);

        for (const team of match.teams) {
          for (const player of team.players) {
            await trx
              .update(user)
              .set({ elo: player.elo })
              .where(eq(user.id, player.id));
          }
        }
      });
      await syncIfLocal();
      return html(maForm());
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
        const playerIds = [
          body.white1Id,
          body.white2Id,
          body.black1Id,
          body.black2Id,
        ].filter((id) => id !== "");

        const uniqueIds = new Set(playerIds);
        if (uniqueIds.size !== playerIds.length) {
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

function mapMatchOutcome(match_winner: "White" | "Black" | "Draw") {
  switch (match_winner) {
    case "White":
      return "win";
    case "Black":
      return "loss";
    case "Draw":
      return "draw";
  }
}

function matchSearchResults(results: { name: string; id: string }[]) {
  return (
    <>
      {results.map((result) => (
        <option value={result.name} id={result.id}>
          {result.name}
        </option>
      ))}
    </>
  );
}

function MatchPage(
  session: Session | null,
  headers: Record<string, string | null>,
  isFirefoxMobile = false,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        MatchForm(session, isFirefoxMobile)
      ) : (
        <LayoutHtml>{MatchForm(session, isFirefoxMobile)}</LayoutHtml>
      )}
    </>
  );
}

function MatchForm(session: Session | null, isFirefoxMobile: boolean) {
  return (
    <>
      <NavbarHtml session={session} activePage="match" />
      <HeaderHtml title="Log match" />
      {isFirefoxMobile ? (
        <div class="text-center">
          <p>
            Firefox mobile doesn't support the datalist element 😭 so you are
            out of luck
          </p>
          <a
            class="font-medium text-blue-500 hover:underline"
            href="https://bugzilla.mozilla.org/show_bug.cgi?id=1535985"
          >
            Firefox bugzilla
          </a>
          <p>
            Help me implement a searchable input field so we can switch away
            from datalist
          </p>
        </div>
      ) : (
        maForm()
      )}
    </>
  );
}

async function maForm() {
  return (
    <>
      <form
        method="post"
        id="matchForm"
        hx-ext="response-targets"
        enctype="multipart/form-data"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="outerHTML"
        hx-target="#matchForm"
        hx-params="not name"
        hx-target-400="#errors"
      >
        <input type="hidden" form="matchForm" id="white1Id" name="white1Id" />
        <input type="hidden" form="matchForm" id="white2Id" name="white2Id" />
        <input type="hidden" form="matchForm" id="black1Id" name="black1Id" />
        <input type="hidden" form="matchForm" id="black2Id" name="black2Id" />
        <script>
          {function checkUserKeydown(event: Event) {
            // Don't submit a search on enter or when selecting an entry with the mouse
            return event instanceof KeyboardEvent && event.key !== "Enter";
          }}
        </script>

        <div class="group relative z-0 mb-6 w-full border-b">
          <span class="text-white">White team</span>
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-get="/match/search"
            form="matchForm"
            label="White player 1"
            hx-trigger="keyup[checkUserKeydown.call(this, event)] changed delay:300ms"
            outputField="white1Id"
            dataListId="white1"
            required="true"
          />
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-get="/match/search"
            form="matchForm"
            label="White player 2 (Optional)"
            hx-trigger="keyup[checkUserKeydown.call(this, event)] changed delay:300ms"
            outputField="white2Id"
            dataListId="white2"
          />
        </div>

        <div class="group relative z-0 mb-6 w-full border-b">
          <span class="text-white">Black team</span>
        </div>

        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-get="/match/search"
            required="true"
            form="matchForm"
            label="Black player 1"
            outputField="black1Id"
            hx-trigger="keyup[checkUserKeydown.call(this, event)] changed delay:300ms"
            dataListId="black1"
          />
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-get="/match/search"
            form="matchForm"
            label="Black player 2 (Optional)"
            hx-trigger="keyup[checkUserKeydown.call(this, event)] changed delay:300ms"
            outputField="black2Id"
            dataListId="black2"
          />
        </div>

        <div class="group relative z-0 mb-6 w-full border-b">
          <span class="text-white">Match result</span>
        </div>

        <div class="group relative z-0 mb-6 w-full">
          <select
            name="match_winner"
            form="matchForm"
            id="match_winner"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm   text-white focus:border-blue-500 focus:outline-none focus:ring-0"
            required="true"
          >
            <option disabled value="" selected="true">
              Select a winner
            </option>
            <option>White</option>
            <option>Black</option>
            <option>Draw</option>
          </select>
          <label
            for="match_winner"
            class="absolute top-3 origin-[0] -translate-y-6 scale-75 transform bg-gray-900 text-sm text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
          >
            Match Winner
          </label>
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <input
            type="number"
            form="matchForm"
            name="point_difference"
            id="point_difference"
            class="peer block w-full appearance-none border-0 border-b-2  border-gray-600 bg-transparent px-0 py-2.5   text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-0"
            placeholder=" "
            required="true"
            min="0"
            max="960"
            step="5"
          />
          <label
            for="point_difference"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm  text-gray-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-500"
          >
            Point difference
          </label>
        </div>

        <button
          type="submit"
          class="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
        >
          Submit match result
        </button>
        <div id="errors" class="text-red-500"></div>
      </form>
    </>
  );
}
