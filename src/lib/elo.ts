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
  const [whiteTeam, blackTeam] = result.teams;
  const whiteElo = getTeamElo(whiteTeam);
  const blackElo = getTeamElo(blackTeam);

  const whiteExpectedScore = getExpectedScore(whiteElo, blackElo);
  const blackExpectedScore = getExpectedScore(blackElo, whiteElo);
  const whiteActualScore =
    result.outcome === "win" ? 1 : result.outcome === "loss" ? 0 : 0.5;
  const blackActualScore =
    result.outcome === "win" ? 0 : result.outcome === "loss" ? 1 : 0.5;
  const whitekFactor = getKFactor(whiteElo);
  const blackkFactor = getKFactor(blackElo);

  const whiteeloChange = Math.round(
    whitekFactor * (whiteActualScore - whiteExpectedScore),
  );
  const blackEloChange = Math.round(
    blackkFactor * (blackActualScore - blackExpectedScore),
  );
  return { white: whiteeloChange, black: blackEloChange };
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
  if (elo > 2500) return 16;
  if (elo > 2300) return 24;
  if (elo > 2100) return 32;
  if (elo > 1900) return 40;
  if (elo > 1700) return 48;
  if (elo > 1600) return 56;
  return 64;
}
