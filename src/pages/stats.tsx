import { type ChartConfiguration } from "chart.js";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatchesWithPlayersHighPerformance } from "../db/queries/matchQueries";
import { isHxRequest, measure, notEmpty } from "../lib";
import MatchStatistics, { mapToMatches } from "../lib/matchStatistics";

export const stats = new Elysia({
  prefix: "/stats",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => statsPage(session, headers));
  });

async function statsPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(session)
      ) : (
        <LayoutHtml>{page(session)}</LayoutHtml>
      )}
    </>
  );
}

async function page(session: Session | null) {
  const { elaspedTimeMs, result: matchesWithPlayers } = await measure(
    async () => {
      return await getMatchesWithPlayersHighPerformance();
    },
  );
  console.log("stats page database calls", elaspedTimeMs, "ms");

  const now = performance.now();
  const matches = mapToMatches(matchesWithPlayers);
  const matchesToday = MatchStatistics.gamesToday(matches);
  const matchesYesterday = MatchStatistics.gamesYesterday(matches);
  const { date: dayWithMostGames, games: mostGamesOnOneDay } =
    MatchStatistics.mostGamesInOneDay(matches);

  const { highestWinStreak, highestLoseStreak } =
    MatchStatistics.highestStreak(matchesWithPlayers);

  const playerWithMostGames =
    MatchStatistics.playerWithMostGames(matchesWithPlayers);

  const playerWithHighestWinRate = MatchStatistics.playerWithWinrate(
    matchesWithPlayers,
    false,
  );

  const playerWithLowestWinRate = MatchStatistics.playerWithWinrate(
    matchesWithPlayers,
    true,
  );

  const gameResults = MatchStatistics.winsByResult(matches);
  console.log("metrics took ", performance.now() - now + "ms  to run");

  const data = {
    labels: ["White win", "Black win", "Draw"],
    datasets: [
      {
        label: "Matches",
        data: [
          gameResults.whiteWins.wins,
          gameResults.blackWins.wins,
          gameResults.numOfDraws.draws,
        ],
        backgroundColor: ["#fffffe", "rgb(35, 43, 43)", "#D3D3D3"],
        hoverOffset: 4,
      },
    ],
  };

  const config: ChartConfiguration = {
    type: "doughnut",
    data: data,
    options: {
      plugins: {
        legend: {
          display: false,
          labels: {
            color: "#fffffe",
          },
          position: "left",
        },
      },
      elements: {
        arc: {
          borderWidth: 2,
          borderColor: "#ff8906",
        },
      },
    },
  };

  return (
    <>
      <NavbarHtml session={session} activePage="stats" />
      <HeaderHtml title="Statistics" />
      <div class="grid grid-cols-6 gap-3 text-white md:grid-cols-12">
        <StatsCardHtml title="Games">
          <>
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-3xl font-bold">{gameResults.totalGames}</span>
              <span class="text-lg">Total Games Played</span>
            </div>
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-3xl font-bold">{matchesToday}</span>
              <span class="text-lg">Games Today</span>
            </div>
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-3xl font-bold">{matchesYesterday}</span>
              <span class="text-lg">Games Yesterday</span>
            </div>
          </>
        </StatsCardHtml>
        <StatsCardHtml title="Biggest win">
          {biggestWin(matchesWithPlayers)}
        </StatsCardHtml>
        <StatsCardHtml title="Winrates">
          <>
            <div class="flex h-48 w-full items-center justify-center pt-5">
              <canvas class="" id="chartDoughnut"></canvas>
            </div>
            <script>
              {`new Chart(document.getElementById("chartDoughnut"), ${JSON.stringify(
                config,
              )})`}
            </script>
          </>
        </StatsCardHtml>
        <StatsCardHtml title="Winrate By Color">
          <>
            <div class="flex flex-col items-center justify-center gap-1">
              <span class="text-5xl">{gameResults.whiteWins.wins}</span>
              <span class="text-md">
                {gameResults.whiteWins.procentage.toFixed(2)}%
              </span>
              <span class="text-xl">White wins</span>
            </div>
            <div class="flex flex-col items-center justify-center gap-1">
              <span class="text-5xl">{gameResults.numOfDraws.draws}</span>
              <span class="text-md">
                {gameResults.numOfDraws.procentage.toFixed(2)}%
              </span>
              <span class="text-xl">Draws</span>
            </div>
            <div class="flex h-full flex-col items-center justify-center gap-1">
              <span class="text-5xl">{gameResults.blackWins.wins}</span>
              <span class="text-md">
                {gameResults.blackWins.procentage.toFixed(2)}%
              </span>
              <span class="text-xl">Black wins</span>
            </div>
          </>
        </StatsCardHtml>
        <StatsCardHtml title="Most Games Played">
          {playerWithMostGames && (
            <span class="text-sm">
              <b>{playerWithMostGames.player.name}</b> has played the most games
              with <b>{playerWithMostGames.games} games played</b>
            </span>
          )}
        </StatsCardHtml>
        <StatsCardHtml title="Most Active Day">
          {dayWithMostGames && (
            <span class="text-sm">
              <b>
                {new Date(dayWithMostGames).toLocaleString("en-US", {
                  day: "numeric",
                  month: "long",
                })}
              </b>{" "}
              was the most active day with{" "}
              <b>{mostGamesOnOneDay} games played</b>
            </span>
          )}
        </StatsCardHtml>
        <StatsCardHtml title="Longest Win Streak">
          {highestWinStreak && (
            <span class="text-sm">
              <b>{highestWinStreak.player?.name}</b> has the longest win streak
              with <b>{highestWinStreak.streak} wins in a row</b>
            </span>
          )}
        </StatsCardHtml>
        <StatsCardHtml title="Longest Losing Streak">
          {highestLoseStreak && (
            <span class="text-sm">
              <b>{highestLoseStreak.player?.name}</b> has the longest losing
              streak with <b>{highestLoseStreak.streak} losses in a row</b>
            </span>
          )}
        </StatsCardHtml>
        <StatsCardHtml title="Highest Win Rate">
          {playerWithHighestWinRate && (
            <span class="text-sm">
              <b>{playerWithHighestWinRate.player.name}</b> has the highest win
              rate with{" "}
              <b>
                {(playerWithHighestWinRate.winrate * 100).toFixed(2)}% over{" "}
                {playerWithHighestWinRate.totalGames} games
              </b>
            </span>
          )}
        </StatsCardHtml>
        <StatsCardHtml title="Lowest Win Rate">
          {playerWithLowestWinRate && (
            <span class="text-sm">
              <b>{playerWithLowestWinRate.player.name}</b> has the lowest win
              rate with{" "}
              <b>
                {(playerWithLowestWinRate.winrate * 100).toFixed(2)}% over{" "}
                {playerWithLowestWinRate.totalGames} games
              </b>
            </span>
          )}
        </StatsCardHtml>
      </div>
      <div class="flex flex-col items-center"></div>
    </>
  );
}

async function biggestWin(matches: MatchWithPlayers[]) {
  const biggestWin = Math.max(...matches.map((mt) => mt.scoreDiff));
  const biggestWinMatch = matches.find((mt) => mt.scoreDiff === biggestWin);
  if (!biggestWinMatch) return <></>;

  const biggestPlayers = {
    black: [
      biggestWinMatch.blackPlayerOne.name,
      biggestWinMatch.blackPlayerTwo?.name,
    ].filter(notEmpty),
    white: [
      biggestWinMatch.whitePlayerOne.name,
      biggestWinMatch.whitePlayerTwo?.name,
    ].filter(notEmpty),
  };

  return (
    <span class="text-sm">
      On{" "}
      {biggestWinMatch.createdAt.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      })}
      , the White team of{" "}
      <span class="font-bold">{biggestPlayers.white.join(" & ")}</span> faced
      off against the Black team of{" "}
      <span class="font-bold">{biggestPlayers.black.join(" & ")}</span>. The{" "}
      {biggestWinMatch.result.toLowerCase()} team triumphed with a {biggestWin}
      -point difference.
    </span>
  );
}
