import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { MatchupHtml } from "../../components/tournament/matchup";
import { RoundHtml } from "../../components/tournament/round";
import { ctx } from "../../context";
import { torunamentTbl } from "../../db/schema";
import { type InsertTournament } from "../../db/schema/tournament/tournament";
import {
  tournamentTeamTbl,
  type InsertTournamentTeam,
} from "../../db/schema/tournament/tournamentTeam";

export const tournament = new Elysia({ prefix: "/tournament" })
  .use(ctx)
  .get("/", async ({ html, session, readDb, writeDb }) => {
    const activeTournament = await readDb.query.torunamentTbl.findFirst({
      where: eq(torunamentTbl.active, true),
      with: {
        matches: {
          columns: {
            team1: true,
            team2: true,
            result: true,
            bracket: true,
            round: true,
          },
        },
        teams: {
          columns: {
            teamName: true,
            teamElo: true,
          },
          with: {
            members: {
              with: {
                user: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!activeTournament) {
      const tournament: InsertTournament = {
        active: true,
        name: "Test Tournament",
        description: "This is a test tournament",
        mode: "Double Elimination",
      };
      const tournamentId = (
        await writeDb
          .insert(torunamentTbl)
          .values(tournament)
          .returning({ insertedId: torunamentTbl.id })
      )[0].insertedId;

      const teams: InsertTournamentTeam[] = [
        {
          teamName: "Team 1",
          teamElo: 1400,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 2",
          teamElo: 1000,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 3",
          teamElo: 1300,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 4",
          teamElo: 1300,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 5",
          teamElo: 1400,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 6",
          teamElo: 1200,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 7",
          teamElo: 1000,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 8",
          teamElo: 1200,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 9",
          teamElo: 1100,
          tournamentId: tournamentId,
        },
        {
          teamName: "Team 10",
          teamElo: 1100,
          tournamentId: tournamentId,
        },
      ];
      await writeDb.insert(tournamentTeamTbl).values(teams);
    }
    if (!activeTournament) return;
    // Add a team to test odd number of teams
    activeTournament.teams.push({
      teamName: "Team 11",
      teamElo: 900,
      members: [],
    });
    // teams are matched up based on elo with highest elo getting a bye in case of odd number of teams
    const teams = activeTournament.teams.sort((a, b) => a.teamElo - b.teamElo);

    const matches: {
      team1: string;
      team2: string;
      result: "Win" | "Loss";
      round: number;
      matchNumber: number;
      bracket: "Upper" | "Lower";
    }[] = [
      {
        bracket: "Upper",
        result: "Win",
        round: 1,
        team1: "Team 11",
        team2: "Team 2",
        matchNumber: 0,
      },
      {
        bracket: "Upper",
        result: "Loss",
        round: 1,
        team1: "Team 7",
        team2: "Team 9",
        matchNumber: 1,
      },
      {
        bracket: "Upper",
        result: "Win",
        round: 2,
        team1: "Team 11",
        team2: "Team 9",
        matchNumber: 0,
      },
      {
        bracket: "Upper",
        result: "Win",
        round: 1,
        team1: "Team 8",
        team2: "Team 3",
        matchNumber: 3,
      },
      {
        bracket: "Upper",
        result: "Win",
        round: 1,
        team1: "Team 5",
        team2: "",
        matchNumber: 5,
      },
    ];
    const bracket = initialSeeding(teams);
    const bracketWithResults = updateBracketWithResults(bracket, matches);

    return html(() => (
      <LayoutHtml>
        <NavbarHtml activePage="leaderboard" session={session} />
        <HeaderHtml title="Tournament" />
        <div class="flex p-5">
          {Object.entries(bracketWithResults).map(([_, roundTeams]) => (
            <RoundHtml>
              {roundTeams.map((team) => (
                <MatchupHtml
                  team1={team?.Team1?.teamName ?? ""}
                  team2={team?.Team2?.teamName ?? ""}
                  result={team?.Result}
                />
              ))}
            </RoundHtml>
          ))}
        </div>
        <HeaderHtml title="Loser's bracket" />
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

function calculateRounds(teams: number): number {
  // Check if the number of teams is a power of 2
  if ((teams & (teams - 1)) !== 0) {
    // If not a power of 2, find the next power of 2 greater than or equal to the number of teams
    let powerOfTwo = 1;
    while (powerOfTwo < teams) {
      powerOfTwo *= 2;
    }
    teams = powerOfTwo;
  }

  // Calculate the number of rounds using log2
  const rounds = Math.log2(teams);

  return rounds;
}

// Define a function to calculate the number of matches in a round
function calculateMatchesInRound(
  numTeams: number,
  roundNumber: number,
): number {
  const numMatchesInFirstRound = Math.ceil(numTeams / 2);
  return numMatchesInFirstRound / Math.pow(2, roundNumber);
}

// create initial bracket
function initialSeeding(
  teams: TournamentTeam[],
  numRounds: number = calculateRounds(teams.length),
): Record<string, TournamentMatch[]> {
  const teamsSortedByElo = teams.sort((a, b) => a.teamElo - b.teamElo);
  const rounds: Record<string, TournamentMatch[]> = {};

  for (let i = 0; i < numRounds; i++) {
    const roundTeams: TournamentMatch[] = [];
    const remainingTeams = [...teamsSortedByElo];
    const numMatchesInRound = calculateMatchesInRound(remainingTeams.length, i);

    for (let j = 0; j < numMatchesInRound; j++) {
      const team1 = remainingTeams.shift();
      const team2 = remainingTeams.shift();

      if (i == 0) {
        roundTeams.push({
          Team1: team1,
          Team2: team2,
          Result: "Unknown",
          MatchNumber: j,
        });
      } else {
        roundTeams.push({
          Team1: undefined,
          Team2: undefined,
          Result: "Unknown",
          MatchNumber: j,
        });
      }
    }

    rounds[i + 1] = roundTeams;
  }

  return rounds;
}

function updateBracketWithResults(
  bracket: Record<string, TournamentMatch[]>,
  matchResults: {
    team1: string;
    team2: string;
    result: "Win" | "Loss";
    round: number;
    matchNumber: number;
    bracket: "Upper" | "Lower";
  }[],
): Record<string, TournamentMatch[]> {
  const updatedBracket = { ...bracket };

  // Group match results by round and bracket
  const resultsByRound: Record<string, { match: number; team: string }[]> = {};

  matchResults.forEach((match) => {
    const { round, result, team1, team2, matchNumber } = match;
    const roundName = `${round}`;
    if (!resultsByRound[roundName]) {
      resultsByRound[roundName] = [];
    }

    if (!updatedBracket[roundName]) {
      updatedBracket[roundName] = [];
    }

    if (updatedBracket[roundName]?.[matchNumber]) {
      updatedBracket[roundName][matchNumber].Team1 = {
        teamName: team1,
        teamElo: 0,
        members: [],
      };
      updatedBracket[roundName][matchNumber].Team2 = {
        teamName: team2,
        teamElo: 0,
        members: [],
      };
      updatedBracket[roundName][matchNumber].Result = result;

      resultsByRound[roundName].push({
        match: matchNumber,
        team: result === "Win" ? team1 : team2,
      });
    }
  });

  // Generate matchups for subsequent rounds and maintain the structure
  for (let i = 2; i <= Object.keys(updatedBracket).length; i++) {
    const roundName = `${i}`;
    const previousRoundName = `${i - 1}`;
    const currentBracket = updatedBracket[roundName];
    const previousBracket = updatedBracket[previousRoundName];

    if (currentBracket && previousBracket) {
      for (let j = 0; j < currentBracket.length; j++) {
        const currentMatchResult = currentBracket[j];
        const previousMatchResult1 = previousBracket[j * 2];
        const previousMatchResult2 = previousBracket[j * 2 + 1];

        if (currentMatchResult.Result !== "Unknown") {
          // Skip matches that already have results.
          continue;
        }
        console.log(`round: ${roundName}, match: ${j}`);
        // console.log(previousMatchResult1, previousMatchResult2);

        if (
          previousMatchResult1?.Result !== "Unknown" &&
          previousMatchResult2?.Result !== "Unknown"
        ) {
          // Skip matches where both previous matches have not been played yet.
          continue;
        }
        const previousMatchWinner =
          previousMatchResult1?.Result === "Unknown"
            ? undefined
            : previousMatchResult1?.Result === "Win"
            ? previousMatchResult1?.Team1?.teamName
            : previousMatchResult1?.Team2?.teamName;
        const previousMatchWinner2 =
          previousMatchResult2?.Result === "Unknown"
            ? undefined
            : previousMatchResult2?.Result === "Win"
            ? previousMatchResult2?.Team1?.teamName
            : previousMatchResult2?.Team2?.teamName;

        currentMatchResult.Team1 = {
          teamName: previousMatchWinner ?? "",
          teamElo: 0,
          members: [],
        };
        currentMatchResult.Team2 = {
          teamName: previousMatchWinner2 ?? "",
          teamElo: 0,
          members: [],
        };
        currentMatchResult.Result = "Unknown";
      }
    }
  }

  return updatedBracket;
}

interface TournamentMatch {
  Team1?: TournamentTeam;
  Team2?: TournamentTeam;
  Result: "Win" | "Loss" | "Unknown";
  MatchNumber: number;
}

interface TournamentTeam {
  teamName: string;
  teamElo: number;
  members: {
    userId: string | null;
    teamId: number | null;
    user: {
      name: string;
    } | null;
  }[];
}
