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
import { EditIcon, TrashIcon } from "../lib/icons";
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
  // Fallback to first season if activeSeason is undefined :shrug:
  const matchesWithPlayers = await getMatches(activeSeason?.id ?? 0);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="With great power comes great responsibility" />
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
      class="border-1 mb-3 w-full rounded-md border p-4 shadow-md lg:mb-[1%] lg:w-[49.5%]"
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
          <EditIcon />
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
          <TrashIcon />
          <p class="hidden sm:block">Delete</p>
        </button>
      </div>
    </div>
  );
};
