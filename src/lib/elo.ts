import { type EloConfig, type GameResult, type Team } from "../types/elo";

export function applyMatchResult(config: EloConfig, result: GameResult) {
  const [team1, team2] = result.teams;
  const outcome = result.outcome;
  const team1Elo = getTeamElo(team1);
  const team2Elo = getTeamElo(team2);

  const team1ExpectedScore = getExpectedScore(team1Elo, team2Elo);
  const team2ExpectedScore = getExpectedScore(team2Elo, team1Elo);

  const team1ActualScore = outcome === "win" ? 1 : outcome === "loss" ? 0 : 0.5;
  const team2ActualScore = outcome === "win" ? 0 : outcome === "loss" ? 1 : 0.5;

  setTeamElo(team1, team1ExpectedScore, team1ActualScore, config.eloFloor);
  setTeamElo(team2, team2ExpectedScore, team2ActualScore, config.eloFloor);
}

function getTeamElo(team: Team) {
  const totalElo = team.players.reduce((sum, player) => sum + player.elo, 0);
  return totalElo / team.players.length;
}

function setTeamElo(
  team: Team,
  expectedScore: number,
  actualScore: number,
  eloFloor: number,
) {
  const teamKFactor = getKFactor(getTeamElo(team));
  team.players.forEach((player) => {
    const playerNewElo = calculateNewElo(
      teamKFactor,
      player.elo,
      expectedScore,
      actualScore,
      eloFloor,
    );

    player.elo = playerNewElo;
  });
}

function getExpectedScore(playerElo: number, opponentElo: number) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

export function matchEloChange(result: GameResult) {
  const [team1, team2] = result.teams;
  const team1Elo = getTeamElo(team1);
  const team2Elo = getTeamElo(team2);

  const expectedScore = getExpectedScore(team1Elo, team2Elo);
  const actualScore = result.outcome == "draw" ? 0.5 : 1;
  const kFactor = getKFactor(team1Elo);

  const eloChange = kFactor * (actualScore - expectedScore);

  return Math.abs(Math.round(eloChange));
}

function calculateNewElo(
  kFactor: number,
  currentElo: number,
  expectedScore: number,
  actualScore: number,
  eloFloor: number,
) {
  const newElo = Math.round(
    currentElo + kFactor * (actualScore - expectedScore),
  );
  return Math.max(newElo, eloFloor);
}

function getKFactor(elo: number) {
  if (elo < 1700) {
    return 64;
  } else if (elo < 2000) {
    return 32;
  } else {
    return 16;
  }
}
