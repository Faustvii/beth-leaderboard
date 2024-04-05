import { ordinal, rate, rating } from "openskill";
import { type Options, type Rating } from "openskill/dist/types";
import { type EloConfig } from "../types/elo";
import { getDatePartFromDate, subtractDays } from "./dateUtils";
import { isDefined } from "./utils";

export interface RatingSystem<TRating> {
  defaultRating: TRating;
  rateMatch: (match: MatchWithRatings<TRating>) => PlayerWithRating<TRating>[];
  toNumber: (rating: TRating) => number;
}

export interface PlayerWithRating<TRating> {
  player: Player;
  rating: TRating;
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

interface MatchWithRatings<TRating> {
  id: number;
  whitePlayerOne: PlayerWithRating<TRating>;
  whitePlayerTwo: PlayerWithRating<TRating> | null;
  blackPlayerOne: PlayerWithRating<TRating>;
  blackPlayerTwo: PlayerWithRating<TRating> | null;
  result: Winner;
  scoreDiff: number;
  createdAt: Date;
}

export function getRatings<TRating>(
  matches: Match[],
  system: RatingSystem<TRating>,
): PlayerWithRating<TRating>[] {
  const ratings: Record<string, PlayerWithRating<TRating>> = {};

  for (const match of matches.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const matchWithRatings: MatchWithRatings<TRating> = {
      ...match,
      whitePlayerOne: ratings[match.whitePlayerOne.id] ?? {
        player: match.whitePlayerOne,
        rating: system.defaultRating,
      },
      whitePlayerTwo: match.whitePlayerTwo
        ? ratings[match.whitePlayerTwo.id] ?? {
            player: match.whitePlayerTwo,
            rating: system.defaultRating,
          }
        : null,
      blackPlayerOne: ratings[match.blackPlayerOne.id] ?? {
        player: match.blackPlayerOne,
        rating: system.defaultRating,
      },
      blackPlayerTwo: match.blackPlayerTwo
        ? ratings[match.blackPlayerTwo.id] ?? {
            player: match.blackPlayerTwo,
            rating: system.defaultRating,
          }
        : null,
    };

    const newRatings = system.rateMatch(matchWithRatings);
    for (const newRating of newRatings) {
      ratings[newRating.player.id] = newRating;
    }
  }

  return Object.values(ratings).toSorted(
    (a, b) => system.toNumber(b.rating) - system.toNumber(a.rating),
  );
}

export function getPlayerRatingHistory<TRating>(
  matches: Match[],
  playerId: string,
  system: RatingSystem<TRating>,
): Record<string, TRating> {
  const ratings: Record<string, PlayerWithRating<TRating>> = {};

  const playersFirstMatch =
    matches.find(
      (match) =>
        match.whitePlayerOne.id === playerId ||
        match.whitePlayerTwo?.id === playerId ||
        match.blackPlayerOne.id === playerId ||
        match.blackPlayerTwo?.id === playerId,
    )?.createdAt ?? new Date();

  const dayBeforePlayersFirstMatch = subtractDays(playersFirstMatch, 1);

  const playerRatingHistory: Record<string, TRating> = {
    [getDatePartFromDate(dayBeforePlayersFirstMatch)]: system.defaultRating,
  };

  for (const match of matches) {
    const matchWithRatings: MatchWithRatings<TRating> = {
      ...match,
      whitePlayerOne: ratings[match.whitePlayerOne.id] ?? {
        player: match.whitePlayerOne,
        rating: system.defaultRating,
      },
      whitePlayerTwo: match.whitePlayerTwo
        ? ratings[match.whitePlayerTwo.id] ?? {
            player: match.whitePlayerTwo,
            rating: system.defaultRating,
          }
        : null,
      blackPlayerOne: ratings[match.blackPlayerOne.id] ?? {
        player: match.blackPlayerOne,
        rating: system.defaultRating,
      },
      blackPlayerTwo: match.blackPlayerTwo
        ? ratings[match.blackPlayerTwo.id] ?? {
            player: match.blackPlayerTwo,
            rating: system.defaultRating,
          }
        : null,
    };

    const newRatings = system.rateMatch(matchWithRatings);
    for (const newRating of newRatings) {
      ratings[newRating.player.id] = newRating;

      if (newRating.player.id === playerId) {
        playerRatingHistory[getDatePartFromDate(match.createdAt)] =
          newRating.rating;
      }
    }
  }

  return playerRatingHistory;
}

export function openskill(options?: Options): RatingSystem<Rating> {
  const selectedOptions: Options = options ?? {
    mu: 1000, // skill level, higher is better
    sigma: 500, // certainty, lower is more certain
    tau: 0.3, // tau prevents model from getting too certain about a players skill level
    z: 2, // used in calculation of ordinal `my - z * sigma`
  };

  return {
    defaultRating: rating(selectedOptions),

    rateMatch(match: MatchWithRatings<Rating>): PlayerWithRating<Rating>[] {
      const whiteTeam = [
        match.whitePlayerOne.rating,
        match.whitePlayerTwo?.rating,
      ].filter(isDefined);

      const blackTeam = [
        match.blackPlayerOne.rating,
        match.blackPlayerTwo?.rating,
      ].filter(isDefined);

      // Lower is better
      // It makes a difference if the ranking is zero or non-zero, not sure why 🤷
      const outcomeRanking = {
        White: [1, 2],
        Black: [2, 1],
        Draw: [1, 1],
      }[match.result];

      const [
        [whitePlayerOneNewRating, whitePlayerTwoNewRating],
        [blackPlayerOneNewRating, blackPlayerTwoNewRating],
      ] = rate([whiteTeam, blackTeam], {
        ...selectedOptions,
        rank: outcomeRanking,
      });

      const result: PlayerWithRating<Rating>[] = [
        {
          player: match.whitePlayerOne.player,
          rating: whitePlayerOneNewRating,
        },
        {
          player: match.blackPlayerOne.player,
          rating: blackPlayerOneNewRating,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          rating: whitePlayerTwoNewRating,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          rating: blackPlayerTwoNewRating,
        });
      }

      return result;
    },

    toNumber(rating: Rating) {
      return Math.floor(ordinal(rating, selectedOptions));
    },
  };
}

export function elo(config?: EloConfig): RatingSystem<number> {
  function avg(ratings: number[]) {
    const totalElo = ratings.reduce((sum, player) => sum + player, 0);
    return Math.floor(totalElo / ratings.length);
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
    defaultRating: 1500,

    rateMatch(match: MatchWithRatings<number>): PlayerWithRating<number>[] {
      const whiteTeamElo = avg(
        [match.whitePlayerOne.rating, match.whitePlayerTwo?.rating].filter(
          isDefined,
        ),
      );

      const blackTeamElo = avg(
        [match.blackPlayerOne.rating, match.blackPlayerTwo?.rating].filter(
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

      const result: PlayerWithRating<number>[] = [
        {
          player: match.whitePlayerOne.player,
          rating: match.whitePlayerOne.rating + whiteTeamEloChange,
        },
        {
          player: match.blackPlayerOne.player,
          rating: match.blackPlayerOne.rating + blackTeamEloChange,
        },
      ].filter((x) => isDefined(x.player));

      if (match.whitePlayerTwo) {
        result.push({
          player: match.whitePlayerTwo.player,
          rating: match.whitePlayerTwo.rating + whiteTeamEloChange,
        });
      }

      if (match.blackPlayerTwo) {
        result.push({
          player: match.blackPlayerTwo?.player,
          rating: match.blackPlayerTwo.rating + blackTeamEloChange,
        });
      }

      return result;
    },

    toNumber(score: number) {
      return Math.floor(score);
    },
  };
}
