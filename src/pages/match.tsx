import { like } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { SearchHtml } from "../components/Search";
import { ctx } from "../context";
import { session, user } from "../db/schema";
import { isHxRequest } from "../lib";

export const match = new Elysia({
  prefix: "/match",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => MatchPage(session, headers));
  })
  .get(
    "/search",
    async ({ readDb, html, query: { player1, player2, player3, player4 } }) => {
      const name = player1 || player2 || player3 || player4;
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
          player1: t.String(),
          player2: t.String(),
          player3: t.String(),
          player4: t.String(),
        }),
      ),
    },
  )
  .post("/", async ({ html, body, session, headers }) => {
    console.log("body", body);
    return html(maForm());
  });

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

function maForm() {
  return (
    <>
      <form
        method="post"
        id="matchForm"
        enctype="multipart/form-data"
        // hx-target="#mainContainer"
        hx-indicator=".progress-bar"
        hx-sync="this:abort"
        hx-swap="outerHTML"
        hx-target="#matchForm"
      >
        <input type="hidden" id="player1Id" name="player1Id" />
        <input type="hidden" id="player2Id" name="player2Id" />
        <input type="hidden" id="player3Id" name="player3Id" />
        <input type="hidden" id="player4Id" name="player4Id" />

        <div class="group relative z-0 mb-6 w-full border-b">
          <span>White team</span>
        </div>
        <div class="group relative z-0 mb-6 w-full">
          <SearchHtml
            hx-swap="innerHtml"
            hx-get="/match/search"
            hx-target="#players1"
            list="players1"
            id="player1"
            name="player1"
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
            list="players2"
            id="player2"
            name="player2"
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
            list="players3"
            id="player3"
            name="player3"
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
            list="players4"
            id="player4"
            name="player4"
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
            id="match_winner"
            class="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent px-0 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
            required="true"
          >
            <option disabled value="" selected="true">
              Select a winner
            </option>
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="draw">Draw</option>
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
      </form>

      <datalist id="players1"></datalist>
      <datalist id="players2"></datalist>
      <datalist id="players3"></datalist>
      <datalist id="players4"></datalist>
      <script>
        {changeEventListener({
          id: "player1",
          datalistId: "players1",
          targetId: "player1Id",
        })}
        {changeEventListener({
          id: "player2",
          datalistId: "players2",
          targetId: "player2Id",
        })}
        {changeEventListener({
          id: "player3",
          datalistId: "players3",
          targetId: "player3Id",
        })}
        {changeEventListener({
          id: "player4",
          datalistId: "players4",
          targetId: "player4Id",
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
