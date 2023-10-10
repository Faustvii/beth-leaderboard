import { getUnixDateFromDate, notEmpty } from ".";
import { type Match } from "../db/schema/matches";

class MatchStatistics {
  static highestStreak(matches: Match[]) {
    matches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const winStreaks: Record<string, Record<"White" | "Black", number>> = {};
    const loseStreaks: Record<string, Record<"White" | "Black", number>> = {};

    for (const match of matches) {
      const whitePlayers = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        notEmpty,
      );
      const blackPlayers = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        notEmpty,
      );

      for (const player of whitePlayers) {
        if (!winStreaks[player]) {
          winStreaks[player] = { White: 0, Black: 0 };
        }
        if (!loseStreaks[player]) {
          loseStreaks[player] = { White: 0, Black: 0 };
        }

        if (match.result === "White") {
          winStreaks[player].White++;
          loseStreaks[player].Black = 0;
        } else {
          loseStreaks[player].White++;
          winStreaks[player].Black = 0;
        }
      }

      for (const player of blackPlayers) {
        if (!winStreaks[player]) {
          winStreaks[player] = { White: 0, Black: 0 };
        }
        if (!loseStreaks[player]) {
          loseStreaks[player] = { White: 0, Black: 0 };
        }

        if (match.result === "Black") {
          winStreaks[player].Black++;
          loseStreaks[player].White = 0;
        } else {
          loseStreaks[player].Black++;
          winStreaks[player].White = 0;
        }
      }
    }

    let highestWinningPlayer = "";
    let highestWinningStreak = 0;
    let highestLosingPlayer = "";
    let highestLosingStreak = 0;

    for (const player in winStreaks) {
      const playerWinStreak = winStreaks[player];
      const playerWinStreakTotal =
        playerWinStreak.Black + playerWinStreak.White;
      if (playerWinStreakTotal > highestWinningStreak) {
        highestWinningPlayer = player;
        highestWinningStreak = playerWinStreakTotal;
      }
    }

    for (const player in loseStreaks) {
      const playerLoseStreak = loseStreaks[player];
      const playerLoseStreakTotal =
        playerLoseStreak.Black + playerLoseStreak.White;
      if (playerLoseStreakTotal > highestLosingStreak) {
        highestLosingPlayer = player;
        highestLosingStreak = playerLoseStreakTotal;
      }
    }

    return {
      highestWinStreak: {
        player: highestWinningPlayer,
        streak: highestWinningStreak,
      },
      highestLoseStreak: {
        player: highestLosingPlayer,
        streak: highestLosingStreak,
      },
    };
  }

  static totalGamesPlayed(matches: Match[]) {
    return matches.length;
  }

  static gamesToday(matches: Match[]) {
    const matchesToday = matches.filter(
      (mt) =>
        getUnixDateFromDate(mt.createdAt) === getUnixDateFromDate(new Date()),
    );
    return matchesToday.length;
  }

  static draws(matches: Match[]) {
    const drawMatches = matches.filter((mt) => mt.result === "Draw").length;
    return drawMatches;
  }

  static mostGamesInOneDay(matches: Match[]) {
    const matchesPerDate = matches.reduce(
      (acc, curr) => {
        const date = new Date(
          curr.createdAt.getFullYear(),
          curr.createdAt.getMonth(),
          curr.createdAt.getDate(),
        ).getTime();
        if (!acc[date]) {
          acc[date] = 1;
        } else {
          acc[date] += 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    const mostGamesOnOneDay = Math.max(...Object.values(matchesPerDate));

    const dayWithMostGames = Number(
      Object.keys(matchesPerDate).find(
        (key) => matchesPerDate[Number(key)] === mostGamesOnOneDay,
      ),
    );

    return { date: new Date(dayWithMostGames), games: mostGamesOnOneDay };
  }

  static mostGamesInOneDayByPlayer(matches: Match[]) {
    const matchesPerDate = matches.reduce(
      (acc, curr) => {
        const date = new Date(
          curr.createdAt.getFullYear(),
          curr.createdAt.getMonth(),
          curr.createdAt.getDate(),
        ).getTime();
        if (!acc[date]) {
          acc[date] = {
            [curr.whitePlayerOne]: 1,
            [curr.whitePlayerTwo]: 1,
            [curr.blackPlayerOne]: 1,
            [curr.blackPlayerTwo]: 1,
          };
        } else {
          acc[date][curr.whitePlayerOne] += 1;
          acc[date][curr.whitePlayerTwo] += 1;
          acc[date][curr.blackPlayerOne] += 1;
          acc[date][curr.blackPlayerTwo] += 1;
        }
        return acc;
      },
      {} as Record<number, Record<string, number>>,
    );

    const mostGamesOnOneDay = Math.max(
      ...Object.values(matchesPerDate).map((date) =>
        Math.max(...Object.values(date)),
      ),
    );

    const dayWithMostGames = Number(
      Object.keys(matchesPerDate).find((key) => {
        const date = matchesPerDate[Number(key)];
        return Math.max(...Object.values(date)) === mostGamesOnOneDay;
      }),
    );

    const playerWithMostGames = Object.keys(
      matchesPerDate[dayWithMostGames],
    ).find(
      (key) => matchesPerDate[dayWithMostGames][key] === mostGamesOnOneDay,
    );

    return {
      date: new Date(dayWithMostGames),
      player: playerWithMostGames,
      games: mostGamesOnOneDay,
    };
  }

  static whichColorWinsTheMost(matches: Match[]): {
    color: "White" | "Black";
    winPercentage: number;
  } {
    const whiteWins = matches.filter((mt) => mt.result === "White").length;
    const blackWins = matches.filter((mt) => mt.result === "Black").length;
    const totalGames = matches.length;
    const whiteWinPercentage = (whiteWins / totalGames) * 100;
    const blackWinPercentage = (blackWins / totalGames) * 100;
    return whiteWinPercentage > blackWinPercentage
      ? { color: "White", winPercentage: whiteWinPercentage }
      : { color: "Black", winPercentage: blackWinPercentage };
  }
}

export default MatchStatistics;
