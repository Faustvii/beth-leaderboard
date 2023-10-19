import { notEmpty } from ".";
import { type Match } from "../db/schema/matches";
import { getDatePartFromDate } from "./dateUtils";

export enum RESULT {
  WIN = "WIN",
  LOSE = "LOSE",
  DRAW = "DRAW",
}

class MatchStatistics {
  static latestMatch(matches: Match[]) {
    if (matches.length === 0) return [];
    const latestMatches = matches.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const players = matches
      .flatMap((mt) => [
        mt.whitePlayerOne,
        mt.whitePlayerTwo,
        mt.blackPlayerOne,
        mt.blackPlayerTwo,
      ])
      .filter(notEmpty)
      .filter((value, index, self) => self.indexOf(value) === index);

    const playersWithLastPlayed = players.map((player) => {
      const playerMatches = latestMatches.filter(
        (mt) =>
          mt.whitePlayerOne === player ||
          mt.whitePlayerTwo === player ||
          mt.blackPlayerOne === player ||
          mt.blackPlayerTwo === player,
      );
      if (playerMatches.length === 0)
        return { player, lastPlayed: new Date(0) };
      return { player, lastPlayed: playerMatches[0].createdAt };
    });

    return playersWithLastPlayed;
  }

  static highestStreak(matches: MatchWithPlayers[]) {
    let highestWinningPlayer: Player | null = null;
    let highestWinningStreak = 0;
    let highestLosingPlayer: Player | null = null;
    let highestLosingStreak = 0;

    const playerStreaks = this.streaksByPlayer(matches);

    for (const streak of playerStreaks) {
      if (streak.highestWinStreak > highestWinningStreak) {
        highestWinningPlayer = streak.player;
        highestWinningStreak = streak.highestWinStreak;
      }

      if (streak.highestLoseStreak > highestLosingStreak) {
        highestLosingPlayer = streak.player;
        highestLosingStreak = streak.highestLoseStreak;
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

  static getPlayersStreak(matches: MatchWithPlayers[], playerId: string) {
    const streaks = this.streaksByPlayer(matches);
    const playerStreak = streaks.find(
      (streak) => streak.player.id === playerId,
    );

    return playerStreak
      ? {
          highestWinStreak: playerStreak.highestWinStreak,
          highestLoseStreak: playerStreak.highestLoseStreak,
        }
      : { highestStreak: 0, loseStreak: 0 };
  }

  static getPlayersEloTrend(matches: MatchWithPlayers[], playerId: string) {
    return matches.map((mt) => {
      const currentTeam = this.getPlayersTeam(mt, playerId);
      const eloChange =
        currentTeam === "White" ? mt.whiteEloChange : mt.blackEloChange;

      return {
        createdAt: mt.createdAt,
        eloChange,
      };
    });
  }

  static test(matches: MatchWithPlayers[], playerId: string) {
    const eloChangeByDay: Record<string, number> = {};

    matches.forEach((mt) => {
      const currentTeam = this.getPlayersTeam(mt, playerId);
      const eloChange =
        currentTeam === "White" ? mt.whiteEloChange : mt.blackEloChange;

      const dateKey = getDatePartFromDate(mt.createdAt);

      eloChangeByDay[dateKey] = (eloChangeByDay[dateKey] || 0) + eloChange;
    });

    const eloTrend = Object.entries(eloChangeByDay).map(
      ([date, eloChange]) => ({
        date: new Date(date),
        eloChange,
      }),
    );

    return eloTrend;
  }

  static getPlayersEasiestAndHardestOpponents(
    matches: MatchWithPlayers[],
    playerId: string,
  ) {
    const hardestCount: Record<string, number> = {};
    const easiestCount: Record<string, number> = {};

    for (const match of matches.filter((x) => x.result !== "Draw")) {
      const { whitePlayers, blackPlayers } = this.getMatchTeams(match);
      const currentTeam = this.getPlayersTeam(match, playerId);
      const opposingPlayers =
        currentTeam == "Black" ? whitePlayers : blackPlayers;

      for (const player of opposingPlayers) {
        const opponentId = player.id;

        if (!hardestCount[opponentId]) {
          hardestCount[opponentId] = 0;
        }

        if (!easiestCount[opponentId]) {
          easiestCount[opponentId] = 0;
        }

        if (match.result === currentTeam) {
          easiestCount[opponentId]++;
        } else {
          hardestCount[opponentId]++;
        }
      }
    }

    let hardestOpponent: { player: Player; games: number } | null = null;
    let easiestOpponent: { player: Player; games: number } | null = null;
    let hardestCountMax = 0;
    let easiestCountMax = 0;

    for (const opponentId in hardestCount) {
      if (hardestCount[opponentId] > hardestCountMax) {
        hardestOpponent = {
          player: matches
            .flatMap((mt) => [
              mt.whitePlayerOne,
              mt.whitePlayerTwo,
              mt.blackPlayerOne,
              mt.blackPlayerTwo,
            ])
            .filter(notEmpty)
            .find((pl) => pl.id === opponentId)!,
          games: hardestCount[opponentId],
        };
        hardestCountMax = hardestCount[opponentId];
      }

      if (easiestCount[opponentId] > easiestCountMax) {
        easiestOpponent = {
          player: matches
            .flatMap((mt) => [
              mt.whitePlayerOne,
              mt.whitePlayerTwo,
              mt.blackPlayerOne,
              mt.blackPlayerTwo,
            ])
            .filter(notEmpty)
            .find((pl) => pl.id === opponentId)!,
          games: easiestCount[opponentId],
        };
        easiestCountMax = easiestCount[opponentId];
      }
    }

    return {
      hardestOpponent,
      easiestOpponent,
    };
  }

  static currentStreaksByPlayer(matches: Match[]) {
    // sort matches so we get the latest first
    matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const playerStreaks: Record<
      string,
      { winStreak: number; loseStreak: number; results: RESULT[] }
    > = {};

    const players = matches
      .flatMap((mt) => [
        mt.whitePlayerOne,
        mt.whitePlayerTwo,
        mt.blackPlayerOne,
        mt.blackPlayerTwo,
      ])
      .filter(notEmpty)
      // Remove duplicates
      .filter((value, index, self) => self.indexOf(value) === index);

    players.forEach((player) => {
      const playerMatches = matches
        .filter(
          (mt) =>
            mt.whitePlayerOne === player ||
            mt.whitePlayerTwo === player ||
            mt.blackPlayerOne === player ||
            mt.blackPlayerTwo === player,
        )
        .slice(0, 5);

      //sort player matches so we get the latest last (for emoji order)
      playerMatches.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      for (const match of playerMatches) {
        const team = this.getPlayersTeamByMatch(match, player);
        if (!playerStreaks[player]) {
          playerStreaks[player] = { winStreak: 0, loseStreak: 0, results: [] };
        }
        if (match.result == team) {
          playerStreaks[player].winStreak++;
          playerStreaks[player].loseStreak = 0;
          playerStreaks[player].results.push(RESULT.WIN);
        } else if (match.result === "Draw") {
          playerStreaks[player].results.push(RESULT.DRAW);
        } else {
          playerStreaks[player].loseStreak++;
          playerStreaks[player].winStreak = 0;
          playerStreaks[player].results.push(RESULT.LOSE);
        }
      }
    });

    return playerStreaks;
  }

  static streaksByPlayer(matches: MatchWithPlayers[]) {
    matches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const playerStreaks: Record<
      string,
      { winStreak: number; loseStreak: number }
    > = {};
    const result: Record<
      string,
      { player: Player; highestWinStreak: number; highestLoseStreak: number }
    > = {};

    for (const match of matches) {
      const { whitePlayers, blackPlayers } = this.getMatchTeams(match);

      for (const player of whitePlayers) {
        const playerId = player.id;
        if (!playerStreaks[playerId]) {
          playerStreaks[playerId] = { winStreak: 0, loseStreak: 0 };
        }

        if (match.result === "White") {
          playerStreaks[playerId].winStreak++;
          playerStreaks[playerId].loseStreak = 0;
        } else {
          playerStreaks[playerId].loseStreak++;
          playerStreaks[playerId].winStreak = 0;
        }

        if (!result[playerId]) {
          result[playerId] = {
            player: player,
            highestWinStreak: 0,
            highestLoseStreak: 0,
          };
        }
        result[playerId].highestWinStreak = Math.max(
          result[playerId].highestWinStreak,
          playerStreaks[playerId].winStreak,
        );
        result[playerId].highestLoseStreak = Math.max(
          result[playerId].highestLoseStreak,
          playerStreaks[playerId].loseStreak,
        );
      }

      for (const player of blackPlayers) {
        const playerId = player.id;
        if (!playerStreaks[playerId]) {
          playerStreaks[playerId] = { winStreak: 0, loseStreak: 0 };
        }

        if (match.result === "Black") {
          playerStreaks[playerId].winStreak++;
          playerStreaks[playerId].loseStreak = 0;
        } else {
          playerStreaks[playerId].loseStreak++;
          playerStreaks[playerId].winStreak = 0;
        }

        if (!result[playerId]) {
          result[playerId] = {
            player: player,
            highestWinStreak: 0,
            highestLoseStreak: 0,
          };
        }
        result[playerId].highestWinStreak = Math.max(
          result[playerId].highestWinStreak,
          playerStreaks[playerId].winStreak,
        );
        result[playerId].highestLoseStreak = Math.max(
          result[playerId].highestLoseStreak,
          playerStreaks[playerId].loseStreak,
        );
      }
    }

    return Object.values(result); // Convert the result to an array of records
  }

  static totalGamesPlayed(matches: Match[] | MatchWithPlayers[]) {
    return matches.length;
  }

  static gamesToday(matches: Match[] | MatchWithPlayers[]) {
    const matchesToday = matches.filter(
      (mt) =>
        getDatePartFromDate(mt.createdAt) === getDatePartFromDate(new Date()),
    );
    return matchesToday.length;
  }

  static gamesYesterday(matches: Match[]) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const matchesYesterday = matches.filter(
      (mt) =>
        getDatePartFromDate(mt.createdAt) === getDatePartFromDate(yesterday),
    );
    return matchesYesterday.length;
  }

  static draws(matches: Match[] | MatchWithPlayers[]) {
    const drawMatches = matches.filter((mt) => mt.result === "Draw").length;
    return drawMatches;
  }

  static mostGamesInOneDay(matches: Match[] | MatchWithPlayers[]) {
    const matchesPerDate = matches.reduce(
      (acc, curr) => {
        const date = getDatePartFromDate(curr.createdAt);
        if (!acc[date]) {
          acc[date] = 1;
        } else {
          acc[date] += 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostGamesOnOneDay = Math.max(...Object.values(matchesPerDate));

    const dayWithMostGames = Object.keys(matchesPerDate).find(
      (key) => matchesPerDate[key] === mostGamesOnOneDay,
    )!;
    return { date: new Date(dayWithMostGames), games: mostGamesOnOneDay };
  }

  static playerWinRate(matches: Match[], playerId: string) {
    const totalGames = matches.length;
    if (totalGames === 0)
      return { wonGames: 0, draws: 0, lostGames: 0, winPercentage: 0 };

    const blackWins = matches.filter(
      (mt) =>
        mt.result === "Black" &&
        (mt.blackPlayerOne === playerId || mt.blackPlayerTwo === playerId),
    ).length;

    const whiteWins = matches.filter(
      (mt) =>
        mt.result === "White" &&
        (mt.whitePlayerOne === playerId || mt.whitePlayerTwo === playerId),
    ).length;

    const draws = matches.filter((mt) => mt.result === "Draw").length;

    return {
      winPercentage: ((blackWins + whiteWins) / totalGames) * 100,
      wonGames: blackWins + whiteWins,
      draws,
      lostGames: totalGames - (blackWins + whiteWins),
    };
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
      const { whitePlayers, blackPlayers } = this.getMatchTeams(match);

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

  static winsByResult(matches: Match[]) {
    const whiteWins = matches.filter((mt) => mt.result === "White").length;
    const blackWins = matches.filter((mt) => mt.result === "Black").length;
    const totalGames = matches.length;
    const numOfDraws = matches.filter((mt) => mt.result === "Draw").length;
    const whiteWinPercentage = (whiteWins / totalGames) * 100;
    const blackWinPercentage = (blackWins / totalGames) * 100;

    return {
      blackWins: { wins: blackWins, procentage: blackWinPercentage },
      whiteWins: { wins: whiteWins, procentage: whiteWinPercentage },
      totalGames: totalGames,
      numOfDraws: {
        draws: numOfDraws,
        procentage: (numOfDraws / totalGames) * 100,
      },
    };
  }

  static playerWinsByResult(matches: Match[], playerId: string) {
    const whiteWins = matches.filter(
      (mt) =>
        mt.result === "White" &&
        (mt.whitePlayerOne === playerId || mt.whitePlayerTwo === playerId),
    ).length;
    const blackWins = matches.filter(
      (mt) =>
        mt.result === "Black" &&
        (mt.blackPlayerOne === playerId || mt.blackPlayerTwo === playerId),
    ).length;
    const numOfDraws = matches.filter((mt) => mt.result === "Draw").length;
    const totalGames = blackWins + whiteWins + numOfDraws;

    const whiteWinPercentage = (whiteWins / totalGames) * 100;
    const blackWinPercentage = (blackWins / totalGames) * 100;

    return {
      blackWins: { wins: blackWins, procentage: blackWinPercentage },
      whiteWins: { wins: whiteWins, procentage: whiteWinPercentage },
      totalGames: totalGames,
      numOfDraws: {
        draws: numOfDraws,
        procentage: (numOfDraws / totalGames) * 100,
      },
    };
  }

  private static getMatchTeams(match: MatchWithPlayers) {
    const whitePlayers = [match.whitePlayerOne, match.whitePlayerTwo].filter(
      notEmpty,
    );
    const blackPlayers = [match.blackPlayerOne, match.blackPlayerTwo].filter(
      notEmpty,
    );
    return { whitePlayers, blackPlayers };
  }

  private static getMatchTeamsByMatch(match: Match) {
    const whitePlayers = [match.whitePlayerOne, match.whitePlayerTwo].filter(
      notEmpty,
    );
    const blackPlayers = [match.blackPlayerOne, match.blackPlayerTwo].filter(
      notEmpty,
    );
    return { whitePlayers, blackPlayers };
  }

  private static getPlayersTeam(
    match: MatchWithPlayers,
    playerId: string,
  ): "White" | "Black" {
    const { whitePlayers } = this.getMatchTeams(match);
    const currentTeam = whitePlayers.find(
      (x) => (typeof x === "string" ? x : x.id) === playerId,
    )
      ? "White"
      : "Black";
    return currentTeam;
  }

  private static getPlayersTeamByMatch(
    match: Match,
    playerId: string,
  ): "White" | "Black" {
    const { whitePlayers } = this.getMatchTeamsByMatch(match);
    const currentTeam = whitePlayers.find((x) => x === playerId)
      ? "White"
      : "Black";
    return currentTeam;
  }
}

export function mapToMatches(matches: MatchWithPlayers[]): Match[] {
  return matches.map(mapToMatch);
}

export function mapToMatch(match: MatchWithPlayers): Match {
  return {
    ...match,
    whitePlayerOne: match.whitePlayerOne.id,
    whitePlayerTwo: match.whitePlayerTwo ? match.whitePlayerTwo.id : null,
    blackPlayerOne: match.blackPlayerOne.id,
    blackPlayerTwo: match.blackPlayerTwo ? match.blackPlayerTwo.id : null,
  };
}

export default MatchStatistics;
