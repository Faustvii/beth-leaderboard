import { Elysia } from "elysia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { MatchupHtml } from "../../components/tournament/matchup";
import { ctx } from "../../context";

export const tournament = new Elysia({ prefix: "/tournament" })
  .use(ctx)
  .get("/", async ({ html, session, readDb }) => {
    const team = await readDb.query.tournamentTeamTbl.findFirst({
      with: {
        members: {
          columns: {
            userId: true,
          },
        },
      },
    });
    return html(() => (
      <LayoutHtml>
        <NavbarHtml activePage="leaderboard" session={session} />
        <HeaderHtml title="Tournament" />
        <div class="flex p-5">
          <div class="relative col-span-1 flex flex-col justify-around">
            <MatchupHtml team1="Team A" team2="Team B" />
            <MatchupHtml team1="Team C" team2="Team D" />
            <MatchupHtml team1="Team E" team2="Team F" />
            <MatchupHtml team1="Team 1" team2="Team 2" />
            <MatchupHtml team1="Team 3" team2="Team 4" />
            <MatchupHtml team1="Team 5" team2="Team 6" />
            <MatchupHtml team1="Team 7" team2="Team 8" />
            <MatchupHtml team1="Team 9" team2="Team 10" />
          </div>

          <div class="col-span-1 flex flex-col justify-around">
            <MatchupHtml team1="Team A" team2="Team C" />
            <MatchupHtml team1="Team E" team2="Team 1" />
            <MatchupHtml team1="Team 3" team2="Team 5" />
            <MatchupHtml team1="Team 7" team2="Team 9" />
          </div>

          <div class="col-span-1 flex flex-col justify-around">
            <MatchupHtml team1="Team A" team2="Team E" />
            <MatchupHtml team1="Team 3" team2="Team 7" />
          </div>

          <div class="col-span-1 flex flex-col justify-around">
            <MatchupHtml team1="Team A" team2="Team 3" />
          </div>
        </div>
      </LayoutHtml>
    ));
  });
