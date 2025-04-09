import { type ChartConfiguration } from "chart.js";
import Elysia from "elysia";
import { type Session } from "lucia";
import { Chart } from "../components/Chart";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { MatchResultLink } from "../components/MatchResultLink";
import { NavbarHtml } from "../components/Navbar";
import { QuestEventLogTable } from "../components/QuestEventLogTable";
import { SelectGet } from "../components/SelectGet";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getRatingEvents } from "../db/queries/ratingEventQueries";
import { getActiveSeason, getSeasons } from "../db/queries/seasonQueries";
import { getUsersByIds } from "../db/queries/userQueries";
import { isHxRequest, notEmpty, unique } from "../lib";
import { getDatePartFromDate } from "../lib/dateUtils";
import MatchStatistics from "../lib/matchStatistics";
import { processQuestEventsForDisplay } from "../lib/questDisplayUtils";
import { getRatingSystem, type Match } from "../lib/rating";

export const stats = new Elysia({
  prefix: "/stats",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    const activeSeason = await getActiveSeason();
    const activeSeasonId = activeSeason?.id ?? 1;
    return html(() => statsPage(session, headers, activeSeasonId));
  })
  .get("/:seasonId", async ({ html, session, headers, params }) => {
    const seasonId = parseInt(params.seasonId, 10);
    return html(() => statsPage(session, headers, seasonId));
  });

async function statsPage(
  session: Session | null,
  headers: Record<string, string | null>,
  seasonId: number,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(session, seasonId)
      ) : (
        <LayoutHtml>{page(session, seasonId)}</LayoutHtml>
      )}
    </>
  );
}

async function page(session: Session | null, seasonId: number) {
  const [season, matches, ratingEvents] = await Promise.all([
    getActiveSeason(),
    getMatches(seasonId, !!session?.user),
    getRatingEvents(seasonId),
  ]);

  if (!season) {
    return <LayoutHtml>Season not found</LayoutHtml>;
  }

  const ratingSystem = getRatingSystem(
    season.ratingSystem ?? "elo",
    season.ratingEventSystem,
  );
  const seasons = await getSeasons();
  const isAuthenticated = !!session?.user;

  const playerIdsFromEvents = ratingEvents
    .map((e) => e.playerId)
    .filter(unique);
  const users = await getUsersByIds(playerIdsFromEvents, isAuthenticated);
  const userIdToNameMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const processedEventsRaw = processQuestEventsForDisplay(
    ratingEvents,
    ratingSystem,
  );
  const questLogItems = processedEventsRaw.map((item) => ({
    ...item,
    playerName: userIdToNameMap[item.playerId] ?? "Unknown Player",
  }));

  const playerQuestStats: Record<
    string,
    { completed: number; failed: number }
  > = {};
  for (const event of processedEventsRaw) {
    if (event.outcome === "Completed" || event.outcome === "Failed") {
      const playerId = event.playerId;
      if (!playerQuestStats[playerId]) {
        playerQuestStats[playerId] = { completed: 0, failed: 0 };
      }
      if (event.outcome === "Completed") {
        playerQuestStats[playerId].completed++;
      } else {
        playerQuestStats[playerId].failed++;
      }
    }
  }

  const questRatesArray = Object.entries(playerQuestStats)
    .map(([playerId, stats]) => {
      const totalAttempts = stats.completed + stats.failed;
      return {
        playerId,
        name: userIdToNameMap[playerId] ?? "Unknown Player",
        rate: totalAttempts > 0 ? stats.completed / totalAttempts : 0, // Avoid division by zero
        attempts: totalAttempts,
      };
    })
    .filter((p) => p.attempts > 0);

  // Filter further for players with more than 3 attempts for best/worst calculation
  const filteredQuestRatesArray = questRatesArray.filter((p) => p.attempts > 3);

  let playerWithHighestRate: {
    name: string;
    rate: number;
    attempts: number;
  } | null = null;
  if (filteredQuestRatesArray.length > 0) {
    playerWithHighestRate = [...filteredQuestRatesArray].sort(
      (a, b) => b.rate - a.rate,
    )[0];
  }

  let playerWithLowestRate: {
    name: string;
    rate: number;
    attempts: number;
  } | null = null;
  if (filteredQuestRatesArray.length > 0) {
    playerWithLowestRate = [...filteredQuestRatesArray].sort(
      (a, b) => a.rate - b.rate,
    )[0];
  }

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

  // --- Calculate Global Quest Outcomes by Type ---
  const questTypeOutcomes: Record<
    string,
    { completed: number; failed: number }
  > = {};
  for (const event of processedEventsRaw) {
    if (
      (event.outcome === "Completed" || event.outcome === "Failed") &&
      event.questType
    ) {
      const type = event.questType;
      if (!questTypeOutcomes[type]) {
        questTypeOutcomes[type] = { completed: 0, failed: 0 };
      }
      if (event.outcome === "Completed") {
        questTypeOutcomes[type].completed++;
      } else {
        questTypeOutcomes[type].failed++;
      }
    }
  }

  // Sort types based on total completions (or total outcomes, completions first)
  const sortedQuestTypes = Object.entries(questTypeOutcomes).sort(
    ([, outcomeA], [, outcomeB]) => outcomeB.completed - outcomeA.completed,
  );

  const questTypeLabels = sortedQuestTypes.map(([type]) => type);
  const questCompletionData = sortedQuestTypes.map(
    ([, outcomes]) => outcomes.completed,
  );
  const questFailureData = sortedQuestTypes.map(
    ([, outcomes]) => outcomes.failed,
  );

  const questTypeChartConfig: ChartConfiguration = {
    type: "bar",
    data: {
      labels: questTypeLabels,
      datasets: [
        {
          label: "Completed",
          data: questCompletionData,
          backgroundColor: "#4ade80", // Green for success
          borderColor: "#fffffe",
          borderWidth: 1,
        },
        {
          label: "Failed",
          data: questFailureData,
          backgroundColor: "#f87171", // Red for failure
          borderColor: "#fffffe",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          stacked: true, // Enable stacking on X axis
          beginAtZero: true,
          ticks: {
            color: "#fffffe",
            precision: 0,
          },
          grid: { color: "rgba(255, 255, 255, 0.2)" },
        },
        y: {
          stacked: true, // Enable stacking on Y axis
          ticks: { color: "#fffffe" },
          grid: { display: false },
        },
      },
      plugins: {
        legend: {
          display: true, // Show legend
          position: "top", // Position legend at the top
          labels: {
            color: "#fffffe", // Legend label color
          },
        },
        tooltip: {
          // Optional: Customize tooltips if needed for stacked bars
        },
      },
    },
  };
  // --- End Global Quest Outcomes by Type Calculation ---

  // --- Calculate Top & Bottom Players by Quest Points ---
  const playerQuestPoints: Record<string, number> = {};
  for (const event of processedEventsRaw) {
    const points = parseInt(event.bonusString);
    if (!isNaN(points)) {
      playerQuestPoints[event.playerId] =
        (playerQuestPoints[event.playerId] || 0) + points;
    }
  }

  // Map all players with their points
  const allPlayersByPoints = Object.entries(playerQuestPoints)
    .map(([playerId, points]) => ({
      name: userIdToNameMap[playerId] ?? "Unknown Player",
      points: points,
    }))
    .filter((p) => p.points !== 0); // Filter out zero net points

  // Get Top 5
  const top5Players = [...allPlayersByPoints]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // Get Bottom 5
  const bottom5Players = [...allPlayersByPoints]
    .sort((a, b) => a.points - b.points)
    .slice(0, 5);

  // Combine, Deduplicate (by name), and Sort for Display
  const combinedUniquePlayers = [...top5Players, ...bottom5Players]
    .filter(
      (player, index, self) =>
        index === self.findIndex((p) => p.name === player.name),
    )
    .sort((a, b) => b.points - a.points); // Sort final list descending by points

  const topBottomQuestPointsLabels = combinedUniquePlayers.map((p) => p.name);
  const topBottomQuestPointsData = combinedUniquePlayers.map((p) => p.points);

  // Pre-calculate background colors for the combined list
  const topBottomQuestPointsColors = topBottomQuestPointsData.map((points) =>
    points >= 0 ? "#4ade80" : "#f87171",
  );

  // Update the config to use the new combined data
  const topQuestPointsConfig: ChartConfiguration = {
    type: "bar",
    data: {
      labels: topBottomQuestPointsLabels,
      datasets: [
        {
          label: "Rating from quests",
          data: topBottomQuestPointsData,
          backgroundColor: topBottomQuestPointsColors,
          borderColor: "#fffffe",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          ticks: { color: "#fffffe" },
          grid: { color: "rgba(255, 255, 255, 0.2)" },
        },
        y: {
          ticks: { color: "#fffffe" },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  };
  // --- End Top & Bottom Players Calculation ---

  return (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="stats" />
      <div class="flex flex-row justify-between">
        <HeaderHtml title="Statistics" />
        <div class="p-5">
          <SelectGet
            options={seasons.map((season) => ({
              path: `/stats/${season.id}`,
              text: season.name,
            }))}
            selectedIndex={seasons.findIndex(
              (season) => season.id === seasonId,
            )}
          ></SelectGet>
        </div>
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
        <StatsCardHtml title="Biggest win">
          {await biggestWin(matches)}
        </StatsCardHtml>
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
        {/* Conditionally render quest stats based on season setting */}
        {season.ratingEventSystem === "quest" && (
          <>
            <StatsCardHtml title="Best Quester">
              {playerWithHighestRate ? (
                <span class="text-sm">
                  <b>{playerWithHighestRate.name}</b> has the highest success
                  rate with{" "}
                  <b>{(playerWithHighestRate.rate * 100).toFixed(1)}%</b> over{" "}
                  <b>{playerWithHighestRate.attempts} quests attempted</b>.
                </span>
              ) : (
                <span class="text-sm">
                  No quests attempted yet by eligible players (&gt;3 attempts).
                </span>
              )}
            </StatsCardHtml>
            <StatsCardHtml title="Worst Quester">
              {playerWithLowestRate ? (
                <span class="text-sm">
                  <b>{playerWithLowestRate.name}</b> has the lowest success rate
                  with <b>{(playerWithLowestRate.rate * 100).toFixed(1)}%</b>{" "}
                  over <b>{playerWithLowestRate.attempts} quests attempted</b>.
                </span>
              ) : (
                <span class="text-sm">
                  No quests attempted yet by eligible players (&gt;3 attempts).
                </span>
              )}
            </StatsCardHtml>
            <StatsCardHtml title="Quest Outcomes by Type">
              {questTypeLabels.length > 0 ? (
                <div class="h-64 w-full pt-2">
                  <Chart
                    id="questTypeOutcomesChart"
                    config={questTypeChartConfig}
                  ></Chart>
                </div>
              ) : (
                <span class="text-sm">No quest outcomes recorded yet.</span>
              )}
            </StatsCardHtml>
            <StatsCardHtml title="Quest Ratings">
              {topBottomQuestPointsLabels.length > 0 ? (
                <div class="h-64 w-full pt-2">
                  <Chart
                    id="topQuestPointsChart"
                    config={topQuestPointsConfig}
                  ></Chart>
                </div>
              ) : (
                <span class="text-sm">No quest points recorded yet.</span>
              )}
            </StatsCardHtml>
          </>
        )}
        {/* End conditional quest stats */}
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
      {/* Conditionally render latest quests table */}
      {season.ratingEventSystem === "quest" && (
        <StatsCardHtml title="Latest Quests" doubleSize={true}>
          <QuestEventLogTable
            questEvents={questLogItems
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 20)}
            seasonId={seasonId}
            showPlayerColumn={true}
            showDateColumn={true}
            title={undefined}
          />
        </StatsCardHtml>
      )}
    </LayoutHtml>
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
      <MatchResultLink
        seasonId={biggestWinMatch.seasonId}
        matchId={biggestWinMatch.id}
      >
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
            <MatchResultLink seasonId={match.seasonId} matchId={match.id}>
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
        <MatchResultLink seasonId={match.seasonId} matchId={match.id}>
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

function matchhistoryDateToString(date: Date) {
  const milisecondsBetween =
    new Date(getDatePartFromDate(new Date())).getTime() -
    new Date(getDatePartFromDate(date)).getTime();
  const daysBetween = milisecondsBetween / (1000 * 60 * 60 * 24);
  switch (daysBetween) {
    case 0: {
      return "Twoday:";
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

function fancyInBetweenText(scoreDiff: number, losers: string) {
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
