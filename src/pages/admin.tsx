import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { deleteMatch, getMatchesWithPlayers } from "../db/queries/matchQueries";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { isHxRequest, notEmpty } from "../lib";

export const admin = new Elysia({
  prefix: "/admin",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => adminPage(session, headers));
  })
  .delete("/match/:id", ({ params: { id } }) => {
    console.log(id);
    return deleteMatch(parseInt(id));
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
  const matchesWithPlayers = await getMatchesWithPlayers(activeSeason?.id);
  const globalMatchHistory = matchesWithPlayers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 1)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="ADIMINISTWATOR" />
      <StatsCardHtml title="Latest game" doubleSize>
        <>
          <div class="flex flex-col justify-center gap-2">
            {globalMatchHistory ? (
              globalMatchHistory.map((match) => (
                <>
                  <PrettyMatch match={match} />
                </>
              ))
            ) : (
              <span class="text-sm">No matches yet</span>
            )}
          </div>
        </>
      </StatsCardHtml>
    </>
  );
}

interface PrettyMatchProps {
  match: MatchWithPlayers;
}
const PrettyMatch = ({ match }: PrettyMatchProps) => {
  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };
  let winners: string[];
  let losers: string[];

  switch (match.result) {
    case "Draw": {
      return (
        <span class="text-balance">
          <span class="font-bold"> {teamPlayers.white.join(" & ")}</span> drew
          with <span class="font-bold"> {teamPlayers.black.join(" & ")} </span>
          <button
            type="Remove match"
            class="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
            hx-delete={`admin/match/${match.id}`}
            _="on click halt the event then remove the closest <span/>"
          >
            Remove kebab
          </button>
        </span>
      );
    }
    case "White": {
      winners = teamPlayers.white;
      losers = teamPlayers.black;
      break;
    }
    case "Black": {
      winners = teamPlayers.black;
      losers = teamPlayers.white;
      break;
    }
  }
  return (
    <>
      <span id={match.id} class="text-balance" style={`font-size: 16px`}>
        <span class="font-bold">{winners.join(" & ")}</span> {" won by "}{" "}
        {match.scoreDiff}
        {" against "}
        {losers.join(" & ")}{" "}
        <span> gaining {Math.abs(match.blackEloChange)} elo </span>
        <button
          type="Remove match"
          class="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
          hx-delete={`admin/match/${match.id}`}
          _="on click halt the event then remove the closest <span/>"
        >
          Remove kebab
        </button>
      </span>
    </>
  );
};
