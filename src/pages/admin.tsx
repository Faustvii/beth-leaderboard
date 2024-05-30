import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { deleteMatch, getMatches } from "../db/queries/matchQueries";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { isHxRequest, notEmpty, redirect } from "../lib";
import { cn } from "../lib/utils";

export const admin = new Elysia({
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
  .delete("/match/:id", async ({ params: { id } }) => {
    console.log(id);
    await deleteMatch(parseInt(id));
    return;
  });

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
  const activeSeason = await getActiveSeason();
  const matchesWithPlayers = await getMatches(activeSeason?.id);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="With great power comes great responsibility" />
      <StatsCardHtml title="Latest games" doubleSize>
        <>
          {/* TODO: Make gap work? */}
          <div class="flex w-full flex-col flex-wrap gap-3 lg:flex-row">
            {globalMatchHistory.length !== 0 ? (
              globalMatchHistory.map((match) => <MatchCard match={match} />)
            ) : (
              <span class="text-sm">No matches yet</span>
            )}
          </div>
        </>
      </StatsCardHtml>
    </>
  );
}

interface MatchCardProps {
  match: MatchWithPlayers;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };

  return (
    <div
      id={match.id}
      class="border-1 w-full rounded-md border p-4 shadow-md lg:w-1/2"
    >
      <p>Team White: {teamPlayers.white.join(" & ")}</p>
      <p>Team Black: {teamPlayers.black.join(" & ")}</p>
      <p>Match winner: Team {match.result}</p>
      <p>Point difference: {match.scoreDiff}</p>
      <p>
        Game logged:{" "}
        {match.createdAt.toLocaleString("en-US", {
          hourCycle: "h24",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div class={cn("flex pt-3")}>
        <button
          class={cn(
            "flex w-1/2 justify-center gap-3 rounded-l-lg bg-teal-600 p-2 hover:bg-teal-600/85",
          )}
          _="on click call alert('Not implemented yet!')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
            />
          </svg>
          <p class="hidden sm:block">Edit</p>
        </button>
        <button
          type="Remove match"
          class={cn(
            "flex w-1/2 justify-center gap-3 rounded-r-lg bg-red-600 p-2 hover:bg-red-600/85 ",
          )}
          hx-delete={`admin/match/${match.id}`}
          _={`on click halt the event then remove #{"${match.id}"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
          <p class="hidden sm:block">Delete</p>
        </button>
      </div>
    </div>
  );
};
