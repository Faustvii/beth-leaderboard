import { type ChartConfiguration } from "chart.js";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { Chart } from "../components/Chart";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { MatchResultLink } from "../components/MatchResultLink";
import { NavbarHtml } from "../components/Navbar";
import { SeasonPicker } from "../components/SeasonPicker";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { type Season } from "../db/schema/season";
import { measure, notEmpty } from "../lib";
import { skibidiInBetweenText } from "../lib/addMatchSummary.tsx";
import { getDatePartFromDate } from "../lib/dateUtils";
import MatchStatistics from "../lib/matchStatistics";
import { type Match, type Rating, type RatingSystem } from "../lib/ratings/rating";
import { RatingSystemPicker } from "../components/RatingSystemPicker";

export const stats = new Elysia({
  prefix: "/stats",
})
  .use(ctx)
  .get("/", async ({ html, session, headers, season, ratingSystem }) => {
    return html(() => statsPage(session, headers, season, ratingSystem));
  });


async function statsPage(
  session: Session | null,
  headers: Record<string, string | null>,
  season: Season,
  ratingSystem: RatingSystem<Rating>,
) {
  return <LayoutHtml headers={headers}>{page(session, season, ratingSystem)}</LayoutHtml>;
}

async function page(session: Session | null, season: Season, ratingSystem: RatingSystem<Rating>) {
  const { elaspedTimeMs, result: matches } = await measure(async () => {
    return await getMatches(season, !!session?.user);
  });
  console.log("stats page database calls", elaspedTimeMs, "ms");

  const globalMatchHistory = matches
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const now = performance.now();
  const matchesToday = MatchStatistics.gamesToday(matches);
  const matchesYesterday = MatchStatistics.gamesYesterday(matches);
  const { date: dayWithMostGames, games: mostGamesOnOneDay } =
    MatchStatistics.mostGamesInOneDay(matches);

  const { highestWinStreak, highestLoseStreak } =
    MatchStatistics.highestStreak(matches);

  const playerWithMostGames = MatchStatistics.playerWithMostGames(matches);

  const playerWithHighestWinRate = MatchStatistics.playerWithWinrate(
    matches,
    false,
  );

  const playerWithLowestWinRate = MatchStatistics.playerWithWinrate(
    matches,
    true,
  );

  const gameResults = MatchStatistics.winsByResult(matches);
  const decisiveMatches = matches.filter((m) => m.result !== "Draw");
  const bigWins = decisiveMatches.filter((m) => m.scoreDiff >= 50).length;
  const smallWins = decisiveMatches.length - bigWins;
  const winTypePct = (n: number) =>
    gameResults.totalGames > 0
      ? ((n / gameResults.totalGames) * 100).toFixed(2)
      : "0.00";
  console.log("metrics took ", performance.now() - now + "ms  to run");

  const data = {
    labels: ["Wins", "Draw"],
    datasets: [
      {
        label: "Matches",
        data: [
          gameResults.whiteWins.wins + gameResults.blackWins.wins,
          gameResults.numOfDraws.draws,
        ],
        backgroundColor: ["#ff8906", "#fffffe"],
        hoverOffset: 4,
      },
    ],
  };

  const lineChartRaceTopN = 10;
  const lineChartRace = MatchStatistics.getLineChartRace(
    matches,
    ratingSystem,
    lineChartRaceTopN,
  );


  const lineChartRaceConfig: ChartConfiguration = {
    type: "line",
    data: {
      datasets: lineChartRace.map((series) => {
        const color = colorForPlayerId(series.playerId);
        return {
          label: series.name,
          // Chart.js types require y: number, but at runtime y: null marks
          // a gap in the line when used with parsing: false.
          data: series.points as unknown as { x: number; y: number }[],
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointRadius: 0,
        };
      }),
    },
    options: {
      parsing: false,
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { right: 110, bottom: 24 } },
      scales: {
        x: {
          type: "linear",
          ticks: { display: false },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          ticks: {
            color: "#fffffe",
            autoSkip: true,
            maxTicksLimit: 8,
          },
          grid: { color: "rgba(255,255,255,0.05)" },
          title: {
            display: true,
            text: "Rating",
            color: "rgba(255,255,255,0.55)",
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        // @ts-expect-error custom plugin registered in base.tsx
        lineChartRace: {
          enabled: true,
          autoplay: true,
          totalRaceMs: 75000,
          windowSize: 50,
          playButtonId: "lineRacePlayBtn",
        },
      },
    },
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
      <div class="flex flex-row items-center justify-between">
        <HeaderHtml title="Statistics" />
        <div class="flex flex-shrink-0 gap-2">
          <RatingSystemPicker
            basePath="/stats"
            season={season}
            ratingSystem={ratingSystem}
          />
          <SeasonPicker basePath="/stats" season={season} />
        </div>
      </div>
      <div class="grid grid-cols-6 gap-3 md:grid-cols-12">
      <StatsCardHtml title="Season Progress" doubleSize>
          <div class="flex w-full flex-col gap-3">
            {lineChartRace.length > 0 ? (
              <>
                <div class="flex flex-row gap-2">
                  <button
                    id="lineRacePlayBtn"
                    type="button"
                    class="rounded-lg bg-blue-500 px-3 py-1 text-sm transition duration-200 hover:bg-blue-600"
                    onclick="window.__lineRace.toggle('chartLineRace', 'lineRacePlayBtn')"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    class="rounded-lg bg-slate-600 px-3 py-1 text-sm transition duration-200 hover:bg-slate-500"
                    onclick="window.__lineRace.reset('chartLineRace', 'lineRacePlayBtn')"
                  >
                    Reset
                  </button>
                </div>
                <div class="h-96 w-full">
                  <Chart
                    id="chartLineRace"
                    config={lineChartRaceConfig}
                  ></Chart>
                </div>
              </>
            ) : (
              <span class="text-sm">No matches yet</span>
            )}
          </div>
        </StatsCardHtml>
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
        <StatsCardHtml title="Biggest win">{biggestWin(matches)}</StatsCardHtml>
        <StatsCardHtml title="Winrates">
          <div class="flex h-48 w-full items-center justify-center pt-5">
            <Chart id="chartDoughnut" config={config}></Chart>
          </div>
        </StatsCardHtml>
        <StatsCardHtml title="Types of wins">
          <>
            <div class="flex flex-col items-center justify-center gap-1">
              <span class="text-5xl">{bigWins}</span>
              <span class="text-md">{winTypePct(bigWins)}%</span>
              <span class="text-xl">Wins farmed</span>
            </div>
            <div class="flex flex-col items-center justify-center gap-1">
              <span class="text-5xl">{smallWins}</span>
              <span class="text-md">{winTypePct(smallWins)}%</span>
              <span class="text-xl">Close games</span>
            </div>
            <div class="flex h-full flex-col items-center justify-center gap-1">
              <span class="text-5xl">{gameResults.numOfDraws.draws}</span>
              <span class="text-md">
                {gameResults.numOfDraws.procentage.toFixed(2)}%
              </span>
              <span class="text-xl">Draws</span>
            </div>
          </>
        </StatsCardHtml>
        <StatsCardHtml title="Most Games Played">
          {playerWithMostGames && (
            <span class="text-sm">
              <b>{playerWithMostGames.player?.name}</b> has played the most
              games with <b>{playerWithMostGames.games} games played</b>
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
        <StatsCardHtml title="Latest games" doubleSize>
          <>
            <div class="flex flex-col justify-center gap-2">
              {globalMatchHistory ? (
                globalMatchHistory.map((match) => (
                  <>
                    <PrettyMatch match={match} />
                  </>
                ))
              ) : (
                <span class="text-sm">No matches yet</span>
              )}
            </div>
          </>
        </StatsCardHtml>
      </div>
      <div class="flex flex-col items-center"></div>
    </>
  );
}

function colorForPlayerId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360}, 70%, 60%)`;
}

async function biggestWin(matches: Match[]) {
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
      <MatchResultLink matchId={biggestWinMatch.id}>
        {biggestWinMatch.createdAt.toLocaleString("en-US", {
          day: "numeric",
          month: "long",
        })}
      </MatchResultLink>
      , the White team of{" "}
      <span class="font-bold">{biggestPlayers.white.join(" & ")}</span> faced
      off against the Black team of{" "}
      <span class="font-bold">{biggestPlayers.black.join(" & ")}</span>. The{" "}
      {biggestWinMatch.result.toLowerCase()} team triumphed with a {biggestWin}
      -point difference.
    </span>
  );
}

interface PrettyMatchProps {
  match: Match;
}
const PrettyMatch = ({ match }: PrettyMatchProps) => {
  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };
  let winners: string[];
  let losers: string[];
  switch (match.result) {
    case "Draw": {
      return (
        <span class="text-balance">
          <span class="font-bold">
            <MatchResultLink matchId={match.id}>
              {matchhistoryDateToString(match.createdAt)}
            </MatchResultLink>
          </span>{" "}
          <span class="font-bold"> {teamPlayers.white.join(" & ")}</span>{" "}
          {"&#128511;"} drew {"&#128511;"} with{" "}
          <span class="font-bold"> {teamPlayers.black.join(" & ")}</span>
        </span>
      );
    }
    case "White": {
      winners = teamPlayers.white;
      losers = teamPlayers.black;
      break;
    }
    case "Black": {
      winners = teamPlayers.black;
      losers = teamPlayers.white;
      break;
    }
  }
  return (
    <span
      class="text-balance"
      style={`font-size: ${match.scoreDiff / 40 + 14}px`}
    >
      <span class="font-bold">
        <MatchResultLink matchId={match.id}>
          {matchhistoryDateToString(match.createdAt)}
        </MatchResultLink>
      </span>{" "}
      <span
        class="font-bold"
        style={`color: #${(winners.join(" ").length % 14).toString(16)}${(
          winners.join(" ").length % 14
        ).toString(16)}fafa`}
      >
        {winners.join(" & ")}
      </span>{" "}
      {skibidiInBetweenText(match.scoreDiff, losers.join(" & "))}
    </span>
  );
};

export function matchhistoryDateToString(date: Date) {
  const milisecondsBetween =
    new Date(getDatePartFromDate(new Date())).getTime() -
    new Date(getDatePartFromDate(date)).getTime();
  const daysBetween = milisecondsBetween / (1000 * 60 * 60 * 24);
  switch (daysBetween) {
    case 0: {
      return "IT Minds:";
    }
    case 1: {
      return "Yesterday:";
    }
    default: {
      return (
        date.toLocaleDateString("en-us", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }) + ":"
      );
    }
  }
}
