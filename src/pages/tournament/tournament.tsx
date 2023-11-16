import { Elysia } from "elysia";
import { number } from "zod";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { MatchupHtml } from "../../components/tournament/matchup";
import { RoundHtml } from "../../components/tournament/round";
import { ctx } from "../../context";
import { getActiveTournament } from "../../db/queries/tournament/tournamentQueries";
import { torunamentTbl } from "../../db/schema";
import { type InsertTournament } from "../../db/schema/tournament/tournament";
import {
  tournamentTeamTbl,
  type InsertTournamentTeam,
} from "../../db/schema/tournament/tournamentTeam";

export const tournament = new Elysia({ prefix: "/tournament" })
  .use(ctx)
  .get("/", async ({ html, session, writeDb }) => {
    const activeTournament = await getActiveTournament();

    if (!activeTournament) {
      const tournament: InsertTournament = {
        active: true,
        name: "Test Tournament",
        description: "This is a test tournament",
        mode: "Single Elimination",
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
    // activeTournament.mode = "Single Elimination";
    // Add a team to test odd number of teams
    activeTournament.teams.push({
      teamName: "Team 11",
      teamElo: 900,
      members: [],
    });
    // teams are matched up based on elo with highest elo getting a bye in case of odd number of teams
    const teams = activeTournament.teams.sort((a, b) => a.teamElo - b.teamElo);

    generateDoubleEliminationBracket(teams.length);

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
      {
        bracket: "Upper",
        result: "Win",
        round: 1,
        team1: "Team 4",
        team2: "Team 1",
        matchNumber: 4,
      },
    ];
    const bracket = initialSeeding(teams);
    const bracketWithResults = updateBracketWithResults(bracket, matches);
    activeTournament.mode = "Double Elimination";

    return html(() => (
      <LayoutHtml>
        <NavbarHtml activePage="leaderboard" session={session} />
        <HeaderHtml title="Upper Bracket" />
        <div class="flex p-5">
          {Object.entries(bracketWithResults.Upper).map(([_, matches]) => (
            <RoundHtml>
              {matches.map((match) => (
                <MatchupHtml
                  team1={match?.Team1?.teamName ?? ""}
                  team2={match?.Team2?.teamName ?? ""}
                  result={match?.Result}
                  matchNumber={match.MatchNumber}
                />
              ))}
            </RoundHtml>
          ))}
        </div>
        {activeTournament.mode === "Double Elimination" && (
          <>
            <HeaderHtml title="Lower bracket" />
            <div class="flex p-5">
              {Object.entries(bracketWithResults.Lower).map(
                ([_, roundTeams]) => (
                  <RoundHtml>
                    {roundTeams.map((match) => (
                      <MatchupHtml
                        team1={match?.Team1?.teamName ?? ""}
                        team2={match?.Team2?.teamName ?? ""}
                        result={match?.Result}
                        matchNumber={match.MatchNumber}
                      />
                    ))}
                  </RoundHtml>
                ),
              )}
            </div>
          </>
        )}
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

function generateDoubleEliminationBracket(teams: number): void {
  if (teams < 2) {
    console.log("Please provide at least 2 teams.");
    return;
  }

  // Ensure an even number of teams
  if (teams % 2 !== 0) {
    teams++;
  }

  const upperBracket: Record<number, number> = {};
  const lowerBracket: Record<number, number> = {};

  // Calculate the number of rounds in the upper bracket
  const numRoundsUpper = Math.ceil(Math.log2(teams));

  // Generate matches for each round in the upper bracket
  for (let round = 1; round <= numRoundsUpper; round++) {
    const matchesInRound = Math.ceil(teams / Math.pow(2, round));
    upperBracket[round] = matchesInRound;
  }

  // Calculate the number of rounds in the lower bracket
  const numRoundsLower = numRoundsUpper + 1;

  // Generate matches for each round in the lower bracket
  // half upper bracket in round
  // half of previous bracket round
  for (let round = 1; round <= numRoundsLower; round++) {
    const matchesInRound =
      round === 1
        ? Math.ceil(teams / Math.pow(2, round))
        : Math.ceil(upperBracket[round] / 2) +
          Math.ceil(lowerBracket[round - 1] / 2);
    lowerBracket[round] = matchesInRound;
  }

  // Print the results
  console.log("Double Elimination Bracket");
  console.log("Upper Bracket:", upperBracket);
  console.log("Lower Bracket:", lowerBracket);
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
): {
  Upper: Record<string, TournamentMatch[]>;
  Lower: Record<string, TournamentMatch[]>;
} {
  const teamsSortedByElo = teams.sort((a, b) => a.teamElo - b.teamElo);
  const upperBracket: Record<string, TournamentMatch[]> = {};
  // const lowerBracket: Record<string, TournamentMatch[]> = {};
  //todo: Fix lower bracket generation

  for (let i = 0; i < numRounds; i++) {
    const upperBracketTeams: TournamentMatch[] = [];
    const remainingTeams = [...teamsSortedByElo];
    const numMatchesInRound = calculateMatchesInRound(remainingTeams.length, i);

    for (let j = 0; j < numMatchesInRound; j++) {
      const team1 = remainingTeams.shift();
      const team2 = remainingTeams.shift();

      if (i == 0) {
        upperBracketTeams.push({
          Team1: team1,
          Team2: team2,
          Result: "Unknown",
          MatchNumber: j,
        });
      } else {
        upperBracketTeams.push({
          Team1: undefined,
          Team2: undefined,
          Result: "Unknown",
          MatchNumber: j,
        });
      }
    }

    upperBracket[i + 1] = upperBracketTeams;
    // lowerBracket[i + 1] = lowerBracketTeams;
  }

  const lowerBracket = calculateLowerBracketStructure(teams, upperBracket);

  return { Upper: upperBracket, Lower: lowerBracket };
}

function updateBracketWithResults(
  brackets: {
    Upper: Record<string, TournamentMatch[]>;
    Lower: Record<string, TournamentMatch[]>;
  },
  matchResults: {
    team1: string;
    team2: string;
    result: "Win" | "Loss";
    round: number;
    matchNumber: number;
    bracket: "Upper" | "Lower";
  }[],
): {
  Upper: Record<string, TournamentMatch[]>;
  Lower: Record<string, TournamentMatch[]>;
} {
  const updatedBracket = { ...brackets };
  const upperBracket = { ...updatedBracket.Upper };
  const lowerBracket = { ...updatedBracket.Lower };

  updateBracketWithMatchResults(
    matchResults.filter((x) => x.bracket === "Upper"),
    upperBracket,
  );
  test(matchResults, lowerBracket, upperBracket);

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

function test(
  matchResults: {
    team1: string;
    team2: string;
    result: "Win" | "Loss";
    round: number;
    matchNumber: number;
    bracket: "Upper" | "Lower";
  }[],
  bracket: Record<string, TournamentMatch[]>,
  upperBracket: Record<string, TournamentMatch[]>,
) {
  const upperBracketMatches = Object.values(upperBracket).reduce(
    (total, roundMatches) => total + roundMatches.length,
    0,
  );

  matchResults
    .filter((x) => x.bracket === "Upper")
    .forEach((match) => {
      const { round, result, team1, team2, matchNumber } = match;
      const roundName = `${round}`;
      if (!bracket[roundName]) {
        bracket[roundName] = [];
      }
      const lowerMatchNumber = calculateLowerBracketMatch(
        matchNumber,
        upperBracketMatches,
      );
      console.log(
        `${team1} vs ${team2} - ${matchNumber} ${round} lowerMatch ${lowerMatchNumber}`,
      );
      if (bracket[roundName]?.[lowerMatchNumber]) {
        if (result === "Loss") {
          bracket[roundName][lowerMatchNumber].Team1 = {
            teamName: team1,
            teamElo: 0,
            members: [],
          };
        } else {
          bracket[roundName][lowerMatchNumber].Team2 = {
            teamName: team2,
            teamElo: 0,
            members: [],
          };
        }
        bracket[roundName][lowerMatchNumber].Result = "Unknown";
      }
    });
}

function calculateLowerBracketStructure(
  teams: TournamentTeam[],
  upperBracket: Record<string, TournamentMatch[]>,
): Record<string, TournamentMatch[]> {
  // const lowerBracketRounds = Object.keys(upperBracket).length - 1;
  let numberOfTeams = teams.length;
  if (numberOfTeams % 2 !== 0) {
    numberOfTeams++;
  }
  const lowerBracket: Record<string, TournamentMatch[]> = {};

  // Calculate the number of rounds in the upper bracket
  const numRoundsUpper = Math.ceil(Math.log2(numberOfTeams));

  // Calculate the number of rounds in the lower bracket
  const numRoundsLower = numRoundsUpper + 1;

  // Generate matches for each round in the lower bracket
  // for (let round = 1; round <= numRoundsLower; round++) {
  //   const matchesInRound =
  //     round === numRoundsLower
  //       ? Math.ceil(teams / Math.pow(2, round + 1))
  //       : Math.ceil(teams / Math.pow(2, round));
  //   lowerBracket[round] = matchesInRound;
  // }

  // Generate matches for each round in the lower bracket

  for (let round = 1; round <= numRoundsLower; round++) {
    const upperBracketMatchesInRound = upperBracket[round]?.length ?? 0;
    const lowerBracketPreviousRoundMatches =
      lowerBracket[round - 1]?.length ?? 0;
    const matchesInRound =
      round == 1
        ? Math.ceil(numberOfTeams / Math.pow(2, round)) / 2
        : Math.ceil(
            (upperBracketMatchesInRound + lowerBracketPreviousRoundMatches) / 2,
          );
    const matches: TournamentMatch[] = [];

    for (let matchNumber = 0; matchNumber < matchesInRound; matchNumber++) {
      matches.push({
        Team1: undefined,
        Team2: undefined,
        Result: "Unknown",
        MatchNumber: matchNumber,
      });
    }

    lowerBracket[`${round}`] = matches;
  }

  return lowerBracket;
}

function calculateLowerBracketMatch(
  upperBracketMatchNumber: number,
  upperBracketMatches: number,
) {
  // Ensure it's not the final round of the upper bracket
  if (upperBracketMatchNumber >= upperBracketMatches / 2) {
    // Return -1 to indicate that this is the final round and there's no corresponding lower bracket match.
    return -1;
  }
  // Calculate the corresponding lower bracket match
  return Math.floor(upperBracketMatchNumber / 2);
}

function updateBracketWithMatchResults(
  matchResults: {
    team1: string;
    team2: string;
    result: "Win" | "Loss";
    round: number;
    matchNumber: number;
    bracket: "Upper" | "Lower";
  }[],
  bracket: Record<string, TournamentMatch[]>,
) {
  matchResults.forEach((match) => {
    const { round, result, team1, team2, matchNumber } = match;
    const roundName = `${round}`;

    if (!bracket[roundName]) {
      bracket[roundName] = [];
    }

    if (bracket[roundName]?.[matchNumber]) {
      bracket[roundName][matchNumber].Team1 = {
        teamName: team1,
        teamElo: 0,
        members: [],
      };
      bracket[roundName][matchNumber].Team2 = {
        teamName: team2,
        teamElo: 0,
        members: [],
      };
      bracket[roundName][matchNumber].Result = result;
    }
  });

  // Generate matchups for subsequent rounds and maintain the structure
  for (let i = 2; i <= Object.keys(bracket).length; i++) {
    const roundName = `${i}`;
    const previousRoundName = `${i - 1}`;
    const currentBracket = bracket[roundName];
    const previousBracket = bracket[previousRoundName];

    if (currentBracket && previousBracket) {
      for (let j = 0; j < currentBracket.length; j++) {
        const currentMatchResult = currentBracket[j];
        const previousMatchResult1 = previousBracket[j * 2];
        const previousMatchResult2 = previousBracket[j * 2 + 1];

        if (currentMatchResult.Result !== "Unknown") {
          // Skip matches that already have results.
          continue;
        }

        if (
          previousMatchResult1?.Result === "Unknown" &&
          previousMatchResult2?.Result === "Unknown"
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
}
