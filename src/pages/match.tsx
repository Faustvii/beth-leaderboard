import { like } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { SearchHtml } from "../components/Search";
import { ctx } from "../context";
import { user } from "../db/schema";
import { isHxRequest, redirect } from "../lib";

export const match = new Elysia({
  prefix: "/match",
})
  .use(ctx)
  .onBeforeHandle(({ session, headers, set }) => {
    if (!session || !session.user) {
      redirect({ set, headers }, "/api/auth/signin/google");
      return true;
    }
  })
  .get("/", async ({ html, session, headers }) => {
    return html(() => MatchPage(session, headers));
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
    async ({ html, body, session, headers }) => {
      console.log("valid body?", body);

      return html(maForm());
    },
    {
      beforeHandle: ({ body, html }) => {
        const playerIds = [
          body.white1Id,
          body.white2Id,
          body.black1Id,
          body.black2Id,
        ].filter((id) => id !== "");

        const uniqueIds = new Set(playerIds);
        if (uniqueIds.size !== playerIds.length) {
          return new Response(
            "The same player can't participate multiple times",
            {
              status: 400,
            },
          );
          return html(
            maForm("The same player can't participate multiple times"),
          );
        }
        if (uniqueIds.size % 2 !== 0) {
          return html(
            maForm("You must have an even amount of players on each team"),
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

function matchSearchResults(results: { name: string; id: string }[]) {
  return (
    <>
      {results.map((result) => (
        <option value={result.name} data-id={result.id} id={result.id} />
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
        MatchForm(session)
      ) : (
        <LayoutHtml>{MatchForm(session)}</LayoutHtml>
      )}
    </>
  );
}

function MatchForm(session: Session | null) {
  return (
    <>
      <NavbarHtml session={session} activePage="match" />
      <HeaderHtml title="Log match" />
      {maForm()}
    </>
  );
}

function maForm(error: string | null = null) {
  return (
    <>
      <form
        method="post"
        id="matchForm"
        hx-ext="response-targets"
        enctype="multipart/form-data"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="innerHTML"
        hx-target="#matchForm"
        hx-params="not name"
        hx-target-400="#errors"
      >
        <input type="hidden" form="matchForm" id="white1Id" name="white1Id" />
        <input type="hidden" form="matchForm" id="white2Id" name="white2Id" />
        <input type="hidden" form="matchForm" id="black1Id" name="black1Id" />
        <input type="hidden" form="matchForm" id="black2Id" name="black2Id" />

        <div class="group relative z-0 mb-6 w-full border-b">
          <span>White team</span>
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-swap="innerHtml"
            hx-get="/match/search"
            hx-target="#players1"
            form="matchForm"
            hx-params="name"
            name="name"
            list="players1"
            id="player1"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            placeholder=" "
            autocomplete="off"
            required="true"
          />
          <label
            for="player1"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform pl-10 text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
          >
            White player 1
          </label>
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-swap="innerHtml"
            hx-get="/match/search"
            hx-target="#players2"
            form="matchForm"
            hx-params="name"
            name="name"
            list="players2"
            id="player2"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            placeholder=" "
            autocomplete="off"
          />
          <label
            for="player2"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform pl-10 text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
          >
            White player 2 (Optional)
          </label>
        </div>

        <div class="group relative z-0 mb-6 w-full border-b">
          <span>Black team</span>
        </div>

        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-swap="innerHtml"
            hx-get="/match/search"
            hx-target="#players3"
            form="matchForm"
            hx-params="name"
            name="name"
            list="players3"
            id="player3"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            placeholder=" "
            required="true"
            autocomplete="off"
          />
          <label
            for="player4"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform pl-10 text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
          >
            Black player 1
          </label>
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-swap="innerHtml"
            hx-get="/match/search"
            hx-target="#players4"
            form="matchForm"
            hx-params="name"
            name="name"
            list="players4"
            id="player4"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            placeholder=" "
            autocomplete="off"
          />
          <label
            for="player4"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform pl-10 text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
          >
            Black player 2 (Optional)
          </label>
        </div>

        <div class="group relative z-0 mb-6 w-full border-b">
          <span>Result</span>
        </div>

        <div class="group relative z-0 mb-6 w-full">
          <select
            name="match_winner"
            form="matchForm"
            id="match_winner"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
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
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
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
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            placeholder=" "
            required="true"
            min="0"
            step="1"
          />
          <label
            for="point_difference"
            class="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-600 dark:text-gray-400 peer-focus:dark:text-blue-500"
          >
            Point difference
          </label>
        </div>

        <button
          type="submit"
          class="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:w-auto"
        >
          Submit match result
        </button>
        <div id="errors" class="text-red-500"></div>
      </form>

      <datalist id="players1"></datalist>
      <datalist id="players2"></datalist>
      <datalist id="players3"></datalist>
      <datalist id="players4"></datalist>
      <script>
        {changeEventListener({
          id: "player1",
          datalistId: "players1",
          targetId: "white1Id",
        })}
        {changeEventListener({
          id: "player2",
          datalistId: "players2",
          targetId: "white2Id",
        })}
        {changeEventListener({
          id: "player3",
          datalistId: "players3",
          targetId: "black1Id",
        })}
        {changeEventListener({
          id: "player4",
          datalistId: "players4",
          targetId: "black2Id",
        })}
      </script>
    </>
  );
}

function changeEventListener({
  id,
  datalistId,
  targetId,
}: {
  id: string;
  datalistId: string;
  targetId: string;
}): string {
  return `
    document.getElementById("${id}")?.addEventListener("change", function () {
      // Get the selected option from the datalist
      const selectedOption = document.querySelector(\`#${datalistId} option[value='\${this.value}']\`);

      if (selectedOption) {
        // Set the hidden input value to the selected option's data-id
        document.getElementById("${targetId}").value = selectedOption.getAttribute("data-id") || "";
      } else {
        // Clear the hidden input value if no valid selection is made
        document.getElementById("${targetId}").value = "";
      }
    });`;
}
