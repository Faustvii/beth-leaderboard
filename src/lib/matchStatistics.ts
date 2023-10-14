import { getUnixDateFromDate, notEmpty } from ".";
import { type Match } from "../db/schema/matches";

class MatchStatistics {
  static highestStreak(matches: MatchWithPlayers[]) {
    matches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const currentWinStreaks: Record<string, number> = {};
    const currentLoseStreaks: Record<string, number> = {};

    let highestWinningPlayer: Player | null = null;
    let highestWinningStreak = 0;
    let highestLosingPlayer: Player | null = null;
    let highestLosingStreak = 0;

    for (const match of matches) {
      const whitePlayers = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        notEmpty,
      );
      const blackPlayers = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        notEmpty,
      );

      for (const player of whitePlayers) {
        const playerId = player.id;
        if (!currentWinStreaks[playerId]) {
          currentWinStreaks[playerId] = 0;
        }
        if (!currentLoseStreaks[playerId]) {
          currentLoseStreaks[playerId] = 0;
        }

        if (match.result === "White") {
          currentWinStreaks[playerId]++;
          currentLoseStreaks[playerId] = 0;
          if (currentWinStreaks[playerId] > highestWinningStreak) {
            highestWinningPlayer = player;
            highestWinningStreak = currentWinStreaks[playerId];
          }
        } else {
          currentLoseStreaks[playerId]++;
          currentWinStreaks[playerId] = 0;
          if (currentLoseStreaks[playerId] > highestLosingStreak) {
            highestLosingPlayer = player;
            highestLosingStreak = currentLoseStreaks[playerId];
          }
        }
      }

      for (const player of blackPlayers) {
        const playerId = player.id;
        if (!currentWinStreaks[playerId]) {
          currentWinStreaks[playerId] = 0;
        }
        if (!currentLoseStreaks[playerId]) {
          currentLoseStreaks[playerId] = 0;
        }

        if (match.result === "Black") {
          currentWinStreaks[playerId]++;
          currentLoseStreaks[playerId] = 0;
          if (currentWinStreaks[playerId] > highestWinningStreak) {
            highestWinningPlayer = player;
            highestWinningStreak = currentWinStreaks[playerId];
          }
        } else {
          currentLoseStreaks[playerId]++;
          currentWinStreaks[playerId] = 0;
          if (currentLoseStreaks[playerId] > highestLosingStreak) {
            highestLosingPlayer = player;
            highestLosingStreak = currentLoseStreaks[playerId];
          }
        }
      }
    }

    return {
      highestWinStreak: {
        player: highestWinningPlayer!,
        streak: highestWinningStreak,
      },
      highestLoseStreak: {
        player: highestLosingPlayer!,
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

  static playerWithWinrate(
    matches: MatchWithPlayers[],
    lowest: boolean,
  ): {
    player: Player;
    winrate: number;
    totalGames: number;
  } {
    const players = matches
      .flatMap((mt) => [
        mt.whitePlayerOne,
        mt.whitePlayerTwo,
        mt.blackPlayerOne,
        mt.blackPlayerTwo,
      ])
      .filter(notEmpty);

    const playerWins = players.reduce(
      (acc, curr) => {
        if (!acc[curr.id]) {
          acc[curr.id] = { wins: 0, total: 1 };
        } else {
          acc[curr.id].total += 1;
        }
        return acc;
      },
      {} as Record<string, { wins: number; total: number }>,
    );

    for (const match of matches) {
      const whitePlayers = [match.whitePlayerOne, match.whitePlayerTwo].filter(
        notEmpty,
      );
      const blackPlayers = [match.blackPlayerOne, match.blackPlayerTwo].filter(
        notEmpty,
      );

      for (const player of whitePlayers) {
        if (match.result === "White") {
          playerWins[player.id].wins += 1;
        }
      }

      for (const player of blackPlayers) {
        if (match.result === "Black") {
          playerWins[player.id].wins += 1;
        }
      }
    }

    const playerWinrates = Object.keys(playerWins).reduce(
      (acc, curr) => {
        const wins = playerWins[curr].wins;
        const total = playerWins[curr].total;
        const winrate = total === 0 ? 0 : wins / total;
        acc[curr] = winrate;
        return acc;
      },
      {} as Record<string, number>,
    );

    const filteredPlayers = players.filter((pl) => playerWins[pl.id].total > 1);

    const sortedPlayers = filteredPlayers.sort((a, b) => {
      if (lowest) {
        return playerWinrates[a.id] - playerWinrates[b.id];
      } else {
        return playerWinrates[b.id] - playerWinrates[a.id];
      }
    });

    const playerWithTargetWinrate = filteredPlayers.find(
      (pl) => pl.id === sortedPlayers[0].id,
    )!;
    const targetWinrate = playerWinrates[sortedPlayers[0].id];
    const playersWithSameWinrate = filteredPlayers.filter(
      (pl) => playerWinrates[pl.id] === targetWinrate,
    );
    const playerWithMostGames = playersWithSameWinrate.reduce((acc, curr) => {
      if (playerWins[curr.id].total > playerWins[acc.id].total) {
        return curr;
      } else {
        return acc;
      }
    }, playersWithSameWinrate[0]);

    return {
      player:
        playersWithSameWinrate.length === 1
          ? playerWithTargetWinrate
          : playerWithMostGames,
      winrate: targetWinrate,
      totalGames: playerWins[playerWithMostGames.id].total,
    };
  }

  static playerWithMostGames(matches: MatchWithPlayers[]): {
    player: Player;
    games: number;
  } {
    const players = matches
      .flatMap((mt) => [
        mt.whitePlayerOne,
        mt.whitePlayerTwo,
        mt.blackPlayerOne,
        mt.blackPlayerTwo,
      ])
      .filter(notEmpty);

    const playerGames = players.reduce(
      (acc, curr) => {
        if (!acc[curr.id]) {
          acc[curr.id] = 1;
        } else {
          acc[curr.id] += 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostGames = Math.max(...Object.values(playerGames));

    const playerWithMostGames = Object.keys(playerGames).find(
      (key) => playerGames[key] === mostGames,
    );

    return {
      player: players.find((pl) => pl.id === playerWithMostGames)!,
      games: mostGames,
    };
  }

  // static mostGamesInOneDayByPlayer(matches: Match[]) {
  //   const matchesPerDate = matches.reduce(
  //     (acc, curr) => {
  //       const date = new Date(
  //         curr.createdAt.getFullYear(),
  //         curr.createdAt.getMonth(),
  //         curr.createdAt.getDate(),
  //       ).getTime();
  //       if (!acc[date]) {
  //         acc[date] = {
  //           [curr.whitePlayerOne]: 1,
  //           [curr.whitePlayerTwo]: 1,
  //           [curr.blackPlayerOne]: 1,
  //           [curr.blackPlayerTwo]: 1,
  //         };
  //       } else {
  //         acc[date][curr.whitePlayerOne] += 1;
  //         acc[date][curr.whitePlayerTwo] += 1;
  //         acc[date][curr.blackPlayerOne] += 1;
  //         acc[date][curr.blackPlayerTwo] += 1;
  //       }
  //       return acc;
  //     },
  //     {} as Record<number, Record<string, number>>,
  //   );

  //   const mostGamesOnOneDay = Math.max(
  //     ...Object.values(matchesPerDate).map((date) =>
  //       Math.max(...Object.values(date)),
  //     ),
  //   );

  //   const dayWithMostGames = Number(
  //     Object.keys(matchesPerDate).find((key) => {
  //       const date = matchesPerDate[Number(key)];
  //       return Math.max(...Object.values(date)) === mostGamesOnOneDay;
  //     }),
  //   );

  //   const playerWithMostGames = Object.keys(
  //     matchesPerDate[dayWithMostGames],
  //   ).find(
  //     (key) => matchesPerDate[dayWithMostGames][key] === mostGamesOnOneDay,
  //   );

  //   return {
  //     date: new Date(dayWithMostGames),
  //     player: playerWithMostGames,
  //     games: mostGamesOnOneDay,
  //   };
  // }

  static whichColorWinsTheMost(matches: Match[]): {
    color: "White" | "Black";
    winPercentage: number;
  } {
    const whiteWins = matches.filter((mt) => mt.result === "White").length;
    const blackWins = matches.filter((mt) => mt.result === "Black").length;
    const totalGames = matches.filter((x) => x.result !== "Draw").length;
    const whiteWinPercentage = (whiteWins / totalGames) * 100;
    const blackWinPercentage = (blackWins / totalGames) * 100;
    return whiteWinPercentage > blackWinPercentage
      ? { color: "White", winPercentage: whiteWinPercentage }
      : { color: "Black", winPercentage: blackWinPercentage };
  }
}

export default MatchStatistics;
