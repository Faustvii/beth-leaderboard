import { ordinal, rate, rating } from "openskill";
import { type Rating } from "openskill/dist/types";
import { EloConfig } from "../types/elo";
import { isDefined } from "./utils";

export interface ScoringSystem<TScore> {
  defaultScore: TScore;
  scoreMatch: (match: MatchWithScores<TScore>) => PlayerWithScore<TScore>[];
  display: (score: TScore) => string;
}

export interface PlayerWithScore<TScore> {
  player: Player;
  score: TScore;
}

type Winner = "Black" | "White" | "Draw";

export interface Match {
  id: number;
  whitePlayerOne: Player;
  whitePlayerTwo: Player | null;
  blackPlayerOne: Player;
  blackPlayerTwo: Player | null;
  result: Winner;
  scoreDiff: number;
  createdAt: Date;
}

interface MatchWithScores<TScore> {
  id: number;
  whitePlayerOne: PlayerWithScore<TScore>;
  whitePlayerTwo: PlayerWithScore<TScore> | null;
  blackPlayerOne: PlayerWithScore<TScore>;
  blackPlayerTwo: PlayerWithScore<TScore> | null;
  result: Winner;
  scoreDiff: number;
  createdAt: Date;
}

export function getScores<TScore>(
  matches: Match[],
  system: ScoringSystem<TScore>,
): PlayerWithScore<TScore>[] {
  const scores: Record<string, PlayerWithScore<TScore>> = {};

  for (const match of matches) {
    const matchWithScores: MatchWithScores<TScore> = {
      ...match,
      whitePlayerOne: scores[match.whitePlayerOne.id] ?? {
        player: match.whitePlayerOne,
        score: system.defaultScore,
      },
      whitePlayerTwo: match.whitePlayerTwo
        ? scores[match.whitePlayerTwo.id] ?? {
            player: match.whitePlayerTwo,
            score: system.defaultScore,
          }
        : null,
      blackPlayerOne: scores[match.blackPlayerOne.id] ?? {
        player: match.blackPlayerOne,
        score: system.defaultScore,
      },
      blackPlayerTwo: match.blackPlayerTwo
        ? scores[match.blackPlayerTwo.id] ?? {
            player: match.blackPlayerTwo,
            score: system.defaultScore,
          }
        : null,
    };

    const newScores = system.scoreMatch(matchWithScores);
    for (const newScore of newScores) {
      scores[newScore.player.id] = newScore;
    }
  }

  return Object.values(scores);
}

export function openskill(): ScoringSystem<Rating> {
  return {
    defaultScore: rating(),

    scoreMatch(match: MatchWithScores<Rating>): PlayerWithScore<Rating>[] {
      const whiteTeam = [
        match.whitePlayerOne.score,
        match.whitePlayerTwo?.score,
      ].filter(isDefined);

      const blackTeam = [
        match.blackPlayerOne.score,
        match.blackPlayerTwo?.score,
      ].filter(isDefined);

      const outcomeRanking = {
        White: [1, 0],
        Black: [0, 1],
        Draw: [1, 1],
      }[match.result];

      const [
        [whitePlayerOneNewScore, whitePlayerTwoNewScore],
        [blackPlayerOneNewScore, blackPlayerTwoNewScore],
      ] = rate([whiteTeam, blackTeam], {
        rank: outcomeRanking,
      });

      const result = [
        {
          player: match.whitePlayerOne.player,
          score: whitePlayerOneNewScore,
        },
        {
          player: match.blackPlayerOne.player,
          score: blackPlayerOneNewScore,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          score: whitePlayerTwoNewScore,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          score: blackPlayerTwoNewScore,
        });
      }

      return result;
    },

    display(score: Rating) {
      return (ordinal(score) * 1000).toFixed(0);
    },
  };
}

export function elo(config?: EloConfig): ScoringSystem<number> {
  function avg(scores: number[]) {
    const totalElo = scores.reduce((sum, player) => sum + player, 0);
    return totalElo / scores.length;
  }

  function getExpectedScore(playerElo: number, opponentElo: number) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
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

  return {
    defaultScore: 1500,

    scoreMatch(match: MatchWithScores<number>): PlayerWithScore<number>[] {
      const whiteTeamElo = avg(
        [match.whitePlayerOne.score, match.whitePlayerTwo?.score].filter(
          isDefined,
        ),
      );

      const blackTeamElo = avg(
        [match.blackPlayerOne.score, match.blackPlayerTwo?.score].filter(
          isDefined,
        ),
      );

      const whiteTeamExpectedScore = getExpectedScore(
        whiteTeamElo,
        blackTeamElo,
      );

      const blackTeamExpectedScore = getExpectedScore(
        blackTeamElo,
        whiteTeamElo,
      );

      const [whiteTeamActualScore, blackTeamActualScore] = {
        White: [1, 0],
        Black: [0, 1],
        Draw: [0.5, 0.5],
      }[match.result];

      const whiteTeamKFactor = getKFactor(whiteTeamElo);
      const blackTeamKFactor = getKFactor(blackTeamElo);

      const whiteTeamEloAfter = calculateNewElo(
        whiteTeamKFactor,
        whiteTeamElo,
        whiteTeamExpectedScore,
        whiteTeamActualScore,
        config?.eloFloor ?? 0,
      );
      const blackTeamEloAfter = calculateNewElo(
        blackTeamKFactor,
        blackTeamElo,
        blackTeamExpectedScore,
        blackTeamActualScore,
        config?.eloFloor ?? 0,
      );

      const whiteTeamEloChange = whiteTeamEloAfter - whiteTeamElo;
      const blackTeamEloChange = blackTeamEloAfter - blackTeamElo;

      const result = [
        {
          player: match.whitePlayerOne.player,
          score: match.whitePlayerOne.score + whiteTeamEloChange,
        },
        {
          player: match.blackPlayerOne.player,
          score: match.blackPlayerOne.score + blackTeamEloChange,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          score: match.whitePlayerTwo.score + whiteTeamEloChange,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          score: match.blackPlayerTwo.score + blackTeamEloChange,
        });
      }

      return result;
    },

    display(score: number) {
      return score.toFixed(0);
    },
  };
}
