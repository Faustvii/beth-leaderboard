import { type ChartConfiguration } from "chart.js";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { Chart } from "../components/Chart";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { MatchResultLink } from "../components/MatchResultLink";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { type Season } from "../db/schema/season";
import { isHxRequest, measure, notEmpty } from "../lib";
import { getDatePartFromDate } from "../lib/dateUtils";
import MatchStatistics from "../lib/matchStatistics";
import { type Match } from "../lib/ratings/rating";
import { SeasonPicker } from "../components/SeasonPicker";

export const stats = new Elysia({
  prefix: "/stats",
})
  .use(ctx)
  .get("/", async ({ html, session, headers, season }) => {
    return html(() => statsPage(session, headers, season));
  });

async function statsPage(
  session: Session | null,
  headers: Record<string, string | null>,
  season: Season,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(session, season)
      ) : (
        <LayoutHtml>{page(session, season)}</LayoutHtml>
      )}
    </>
  );
}

async function page(session: Session | null, season: Season) {
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
      <div class="flex flex-row justify-between">
        <HeaderHtml title="Statistics" />
        <SeasonPicker basePath="/stats" season={season} />
      </div>
      <div class="grid grid-cols-6 gap-3 md:grid-cols-12">
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
      {fancyInBetweenText(match.scoreDiff, losers.join(" & "))}
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

export function fancyInBetweenText(scoreDiff: number, losers: string) {
  switch (true) {
    case scoreDiff > 200:
      return (
        "cleaned the floor winning by " +
        scoreDiff +
        " points humiliating " +
        losers +
        " for life"
      );
    case scoreDiff > 180:
      return "won by " + scoreDiff + " using their feet against " + losers;
    case scoreDiff > 160:
      return (
        "needs to call an &#128511 ambulance &#128511 for " +
        losers +
        " as they lost by " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 140:
      return "tryharded way too hard on " + losers + " winning by " + scoreDiff;
    case scoreDiff > 120:
      return (
        "absolutely scooby doo doo'd " +
        losers +
        " by winning with " +
        scoreDiff
      );
    case scoreDiff > 100:
      return (
        "found their inner Slater-power and smashed " +
        losers +
        " winnning by " +
        scoreDiff
      );
    case scoreDiff > 80:
      return (
        "took a well deserved breather while winning against " +
        losers +
        " with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 60:
      return (
        "comfortably manhandled " +
        losers +
        " winning with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 50:
      return (
        "got an undeserved victory against " +
        losers +
        " winning by pathetic " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 40:
      return (
        "won a hard fought battle against " +
        losers +
        " with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 30:
      return (
        "won by simply being better against " +
        losers +
        " winning by " +
        scoreDiff +
        " points"
      );
    case scoreDiff >= 20:
      return (
        "won by sheer luck against " + losers + " with " + scoreDiff + " points"
      );
    case scoreDiff >= 5:
      return (
        "got the tightest of tightest wins against " +
        losers +
        " winning by " +
        scoreDiff
      );
    default:
      return "won ? against ";
  }
}
