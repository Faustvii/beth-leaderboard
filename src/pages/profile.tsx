import { type ChartConfiguration } from "chart.js";
import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { getUser } from "../db/queries/userQueries";
import { isHxRequest, measure, notEmpty } from "../lib";
import MatchStatistics, {
  isPlayerInMatchFilter,
  RESULT,
} from "../lib/matchStatistics";
import { Match } from "../lib/rating";

export const profile = new Elysia({
  prefix: "/profile",
})
  .use(ctx)
  .get("/", ({ html, session, headers }) => {
    return html(page(session, headers, session?.user?.id ?? ""));
  })
  .get("/:userId", ({ html, params, headers, session }) => {
    return html(page(session, headers, params.userId));
  });

async function page(
  session: Session | null,
  headers: Record<string, string | null>,
  userId: string,
) {
  const activeSeason = await getActiveSeason();
  const activeSeasonId = activeSeason?.id ?? 1;

  const { elaspedTimeMs, result: matches } = await measure(() =>
    getMatches(activeSeasonId),
  );
  console.log(`player stats took ${elaspedTimeMs}ms to get from db`);
  let profileName = "Your stats";
  if (!session || (session && session.user.id !== userId)) {
    const user = await getUser(userId);
    if (user) profileName = `${user.name}'s stats`;
  }
  const header = profileName;

  return isHxRequest(headers) ? (
    <>
      <NavbarHtml session={session} activePage="profile" />
      <HeaderHtml title={header} />
      {profileStats(matches, userId)}
    </>
  ) : (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="profile" />
      <HeaderHtml title={header} />
      {profileStats(matches, userId)}
    </LayoutHtml>
  );
}

const profileStats = (matches: Match[], userId: string) => {
  const now = performance.now();
  const playerMatches = matches.filter(isPlayerInMatchFilter(userId));
  const matchesToday = MatchStatistics.gamesToday(playerMatches);
  const matchesYesterday = MatchStatistics.gamesYesterday(playerMatches);

  const colorWinRates = MatchStatistics.playerWinsByResult(
    playerMatches,
    userId,
  );
  const winRate = MatchStatistics.playerWinRate(playerMatches, userId);
  const { highestLoseStreak, highestWinStreak } =
    MatchStatistics.getPlayersStreak(matches, userId);

  const { easiestOpponents, hardestOpponents } =
    MatchStatistics.getPlayersEasiestAndHardestOpponents(matches, userId);

  const { win: biggestWin, loss: biggestLoss } =
    MatchStatistics.biggestWinAndLoss(matches, userId);

  const ratingHistory = MatchStatistics.test(matches, userId);
  const matchHistory = MatchStatistics.getMatchHistory(matches, userId).slice(
    0,
    20,
  );

  const colorWinrateData = {
    labels: ["Won", "Lost", "Draw"],
    datasets: [
      {
        label: "Matches",
        data: [winRate.wonGames, winRate.lostGames, winRate.draws],
        backgroundColor: ["#fffffe", "rgb(35, 43, 43)", "#ff8906"],
        hoverOffset: 4,
      },
    ],
  };

  const winrateConfig: ChartConfiguration = {
    type: "doughnut",
    data: colorWinrateData,
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
          borderWidth: 0,
        },
      },
    },
  };

  const colorFromPrevious = (cur: number, i: number, arr: number[]) => {
    if (i === 0) {
      return "#00FF00";
    }

    const prev = arr[i - 1];

    if (cur >= prev) {
      return "#00FF00";
    }

    return "#FF0000";
  };

  const ratings = ratingHistory.map((x) => x.rating);
  const ratingColor = ratings.map(colorFromPrevious);

  const ratingData = {
    labels: ratingHistory.map((x) =>
      x.date.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      }),
    ),

    datasets: [
      {
        label: "Rating",
        borderColor: "#ff8906",
        data: ratings,
        hoverOffset: 4,
        pointBackgroundColor: ratingColor,
        pointBorderColor: ratingColor,
        tension: 0.1,
      },
    ],
  };

  const ratingTrendConfig: ChartConfiguration = {
    type: "line",
    data: ratingData,
    options: {
      scales: {
        y: {
          ticks: {
            color: "#fffffe",
          },
        },
        x: {
          ticks: {
            color: "#fffffe",
          },
        },
      },
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };
  console.log("metrics took ", performance.now() - now + "ms to run");

  return (
    <div class="grid grid-cols-6 gap-3 text-white md:grid-cols-12">
      <StatsCardHtml title="Games">
        <>
          <div class="flex flex-col items-center justify-center gap-2">
            <span class="text-3xl font-bold">{playerMatches.length}</span>
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
      <StatsCardHtml title="Biggest win/loss">
        <>
          {biggestWin ? (
            matchFaceoff(biggestWin)
          ) : (
            <span class="text-sm">No wins yet</span>
          )}
          {biggestLoss ? (
            matchFaceoff(biggestLoss)
          ) : (
            <span class="text-sm">No losses yet</span>
          )}
        </>
      </StatsCardHtml>
      <StatsCardHtml title="Winrate">
        <>
          <div class="flex h-48 w-full items-center justify-center pt-5">
            <canvas id="chartDoughnut"></canvas>
            <span class="pl-3 text-sm">
              {winRate.winPercentage.toFixed(2)}%
            </span>
          </div>
          <script>
            {`new Chart(document.getElementById("chartDoughnut"), ${JSON.stringify(
              winrateConfig,
            )})`}
          </script>
        </>
      </StatsCardHtml>
      <StatsCardHtml title="Winrate By Color">
        <>
          <div class="flex flex-col items-center justify-center gap-1">
            <span class="text-5xl">{colorWinRates.whiteWins.wins}</span>
            <span class="text-md">
              {colorWinRates.whiteWins.procentage.toFixed(2)}%
            </span>
            <span class="text-xl">White wins</span>
          </div>
          <div class="flex flex-col items-center justify-center gap-1">
            <span class="text-5xl">{colorWinRates.numOfDraws.draws}</span>
            <span class="text-md">
              {colorWinRates.numOfDraws.procentage.toFixed(2)}%
            </span>
            <span class="text-xl">Draws</span>
          </div>
          <div class="flex h-full flex-col items-center justify-center gap-1">
            <span class="text-5xl">{colorWinRates.blackWins.wins}</span>
            <span class="text-md">
              {colorWinRates.blackWins.procentage.toFixed(2)}%
            </span>
            <span class="text-xl">Black wins</span>
          </div>
        </>
      </StatsCardHtml>
      <StatsCardHtml title="Longest Win Streak">
        <span class="text-sm">Top win streak {highestWinStreak}</span>
      </StatsCardHtml>
      <StatsCardHtml title="Longest Losing Streak">
        <span class="text-sm">top lose streak is {highestLoseStreak}</span>
      </StatsCardHtml>
      <StatsCardHtml title="Match history">
        <div class="flex max-h-48 snap-x snap-mandatory flex-col gap-2 overflow-y-auto">
          {matchHistory ? (
            matchHistory.map((history) => {
              return (
                <span class="snap-start text-sm">
                  {winLossDrawIcon(history.result)}{" "}
                  {matchOutput(history, userId)}
                </span>
              );
            })
          ) : (
            <span class="text-sm">No matches yet</span>
          )}
        </div>
      </StatsCardHtml>
      <StatsCardHtml title="Rating history">
        <>
          <div class="flex h-48 w-full items-center justify-center pt-5">
            <canvas id="ratingChart"></canvas>
          </div>
          <script>
            {`new Chart(document.getElementById("ratingChart"), ${JSON.stringify(
              ratingTrendConfig,
            )})`}
          </script>
        </>
      </StatsCardHtml>
      <StatsCardHtml title="Hardest opponents">
        <>
          {hardestOpponents.length !== 0 ? (
            hardestOpponents.slice(0, 3).map((opponent) => (
              <span class="text-sm">
                Lost {opponent.games} times to {opponent.player.name}
              </span>
            ))
          ) : (
            <span class="text-sm">Everyone is easy</span>
          )}
        </>
      </StatsCardHtml>
      <StatsCardHtml title="Easiest opponnents">
        <>
          {easiestOpponents.length !== 0 ? (
            easiestOpponents.slice(0, 3).map((opponent) => (
              <span class="text-sm">
                Won {opponent.games} times against {opponent.player.name}
              </span>
            ))
          ) : (
            <span class="text-sm">Everyone is hard</span>
          )}
        </>
      </StatsCardHtml>
    </div>
  );
};

function winLossDrawIcon(result: RESULT): string {
  if (result === RESULT.WIN) {
    return "✅";
  } else if (result === RESULT.LOSS) {
    return "❌";
  } else {
    return "⬜";
  }
}

function matchFaceoff(biggestWin: {
  match: Match;
  biggestPlayers: { black: string[]; white: string[] };
}): JSX.Element {
  return (
    <span class="text-sm">
      On{" "}
      {biggestWin.match.createdAt.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      })}
      , the White team of{" "}
      <span class="font-bold">
        {biggestWin.biggestPlayers.white.join(" & ")}
      </span>{" "}
      faced off against the Black team of{" "}
      <span class="font-bold">
        {biggestWin.biggestPlayers.black.join(" & ")}
      </span>
      . The {biggestWin.match.result.toLowerCase()} team triumphed with a{" "}
      {biggestWin.match.scoreDiff}
      -point difference.
    </span>
  );
}

function matchOutput(
  {
    match,
    result,
  }: {
    match: Match;
    result: RESULT;
  },
  userId: string,
): JSX.Element {
  const blackTeam = [
    match.blackPlayerOne.name,
    match.blackPlayerTwo?.name,
  ].filter(notEmpty);
  const whiteTeam = [
    match.whitePlayerOne.name,
    match.whitePlayerTwo?.name,
  ].filter(notEmpty);

  const userTeam = MatchStatistics.getPlayersTeam(match, userId);
  const firstTeam = userTeam === "Black" ? blackTeam : whiteTeam;
  const lastTeam = userTeam === "Black" ? whiteTeam : blackTeam;
  return (
    <span class="text-sm">
      On{" "}
      {match.createdAt.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      })}
      , <span class="font-bold">{firstTeam.join(" & ")}</span> faced off against{" "}
      <span class="font-bold">{lastTeam.join(" & ")}</span> and{" "}
      {result === RESULT.DRAW ? "tied" : result === RESULT.WIN ? "won" : "lost"}{" "}
      with {match.scoreDiff} points.
    </span>
  );
}
