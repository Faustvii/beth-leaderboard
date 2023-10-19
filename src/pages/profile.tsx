import { type ChartConfiguration } from "chart.js";
import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatchesWithPlayers } from "../db/queries/matchQueries";
import { getUser } from "../db/queries/userQueries";
import { isHxRequest, measure } from "../lib";
import MatchStatistics, { mapToMatches } from "../lib/matchStatistics";

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
  const { elaspedTimeMs, result: matchesWithPlayers } = await measure(() =>
    getMatchesWithPlayers(userId),
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
      {profileStats(matchesWithPlayers, userId)}
    </>
  ) : (
    <LayoutHtml>
      <NavbarHtml session={session} activePage="profile" />
      <HeaderHtml title={header} />
      {profileStats(matchesWithPlayers, userId)}
    </LayoutHtml>
  );
}

const profileStats = (
  matchesWithPlayers: MatchWithPlayers[],
  playerId: string,
) => {
  const playerMatches = mapToMatches(matchesWithPlayers);
  const matchesToday = MatchStatistics.gamesToday(playerMatches);
  const matchesYesterday = MatchStatistics.gamesYesterday(playerMatches);

  const colorWinRates = MatchStatistics.playerWinsByResult(
    playerMatches,
    playerId,
  );
  const winRate = MatchStatistics.playerWinRate(playerMatches, playerId);
  const { highestLoseStreak, highestWinStreak } =
    MatchStatistics.getPlayersStreak(matchesWithPlayers, playerId);

  const { easiestOpponent, hardestOpponent } =
    MatchStatistics.getPlayersEasiestAndHardestOpponents(
      matchesWithPlayers,
      playerId,
    );

  const eloChanges = MatchStatistics.test(matchesWithPlayers, playerId);

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

  const colorWinrateConfig: ChartConfiguration = {
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

  const eloChangeData = {
    labels: eloChanges.map((x) =>
      x.date.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      }),
    ),

    datasets: [
      {
        label: "Elo",
        borderColor: "#ff8906",
        data: eloChanges.map((x) => x.eloChange),
        hoverOffset: 4,
        pointBackgroundColor: [] as string[],
        pointBorderColor: [] as string[],
        tension: 0.1,
      },
    ],
  };

  eloChangeData.datasets[0].data.forEach(function (value) {
    if (value >= 0) {
      eloChangeData.datasets[0].pointBackgroundColor.push("#00FF00");
      eloChangeData.datasets[0].pointBorderColor.push("#00FF00");
    } else if (value < 0) {
      eloChangeData.datasets[0].pointBackgroundColor.push("#FF0000");
      eloChangeData.datasets[0].pointBorderColor.push("#FF0000");
    }
  });

  const eloChangeConfig: ChartConfiguration = {
    type: "line",
    data: eloChangeData,
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
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };

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
      <StatsCardHtml title="Biggest win">
        <p>biggest win</p>
        {/* {biggestWin(matchesWithPlayers)} */}
      </StatsCardHtml>
      <StatsCardHtml title="Winrate">
        <>
          <div class="flex h-48 w-full items-center justify-center pt-5">
            <canvas class="" id="chartDoughnut"></canvas>
            <span class="pl-2 text-sm">
              {winRate.winPercentage.toFixed(2)}%
            </span>
          </div>
          <script>
            {`new Chart(document.getElementById("chartDoughnut"), ${JSON.stringify(
              colorWinrateConfig,
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
      <StatsCardHtml title="Match history?">
        <span class="text-sm">You doing good...</span>
      </StatsCardHtml>
      <StatsCardHtml title="Elo changes">
        <>
          <div class="flex h-48 w-full items-center justify-center pt-5">
            <canvas class="" id="eloChart"></canvas>
          </div>
          <script>
            {`new Chart(document.getElementById("eloChart"), ${JSON.stringify(
              eloChangeConfig,
            )})`}
          </script>
        </>
      </StatsCardHtml>
      <StatsCardHtml title="Hardest opponent">
        <span class="text-sm">
          you lose the most against {hardestOpponent?.player.name}, you have
          lost to them {hardestOpponent?.games} times
        </span>
      </StatsCardHtml>
      <StatsCardHtml title="Easiest opponnent">
        <span class="text-sm">
          you win the most against {easiestOpponent?.player.name}, you have beat
          them {easiestOpponent?.games} times
        </span>
      </StatsCardHtml>
    </div>
  );
};
