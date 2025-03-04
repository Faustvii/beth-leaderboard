import { type ChartConfiguration } from "chart.js";
import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { type Session } from "lucia";
import { Chart } from "../components/Chart";
import { FoldableCard } from "../components/FoldableCard";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { MatchResultLink } from "../components/MatchResultLink";
import { NavbarHtml } from "../components/Navbar";
import { ProfileForm } from "../components/ProfileForm";
import { QuestDescription } from "../components/QuestDescription";
import { SelectGet } from "../components/SelectGet";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getMatches } from "../db/queries/matchQueries";
import { getActiveQuestsForPlayer } from "../db/queries/questQueries";
import {
  getActiveSeason,
  getSeason,
  getSeasons,
} from "../db/queries/seasonQueries";
import { getUser } from "../db/queries/userQueries";
import { userTbl } from "../db/schema/auth";
import { isHxRequest, measure, notEmpty, redirect } from "../lib";
import { syncIfLocal } from "../lib/dbHelpers";
import MatchStatistics, {
  isPlayerInMatchFilter,
  RESULT,
} from "../lib/matchStatistics";
import { MaxQuestPerPlayer, type Quest } from "../lib/quest";
import {
  getRatingSystem,
  type Match,
  type Rating,
  type RatingSystem,
} from "../lib/rating";
import { cn } from "../lib/utils";

export const profile = new Elysia({
  prefix: "/profile",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    const activeSeason = await getActiveSeason();
    const activeSeasonId = activeSeason?.id ?? 1;
    return html(() =>
      profilePage(session, headers, session?.user?.id ?? "", activeSeasonId),
    );
  })
  .get("/season/:seasonId", async ({ html, session, headers, params }) => {
    const seasonId = parseInt(params.seasonId, 10);
    return html(() =>
      profilePage(session, headers, session?.user?.id ?? "", seasonId),
    );
  })
  .get("/:userId", async ({ html, params, headers, session }) => {
    const activeSeason = await getActiveSeason();
    const activeSeasonId = activeSeason?.id ?? 1;
    return html(() =>
      profilePage(session, headers, params.userId, activeSeasonId),
    );
  })
  .put(
    "/",
    async ({ set, headers, body: { nickname }, writeDb, session }) => {
      if (!session || !session.user) return;
      await writeDb
        .update(userTbl)
        .set({ nickname: nickname })
        .where(eq(userTbl.id, session.user.id));
      await syncIfLocal();

      redirect({ headers, set }, `/profile/${session.user.id}`);
    },
    {
      beforeHandle: (_) => undefined,
      body: t.Object({
        nickname: t.String({ minLength: 1 }),
      }),
    },
  )
  .get(
    "/:userId/season/:seasonId",
    async ({ html, params, headers, session }) => {
      const seasonId = parseInt(params.seasonId, 10);
      return html(() => profilePage(session, headers, params.userId, seasonId));
    },
  );

async function profilePage(
  session: Session | null,
  headers: Record<string, string | null>,
  userId: string,
  seasonId: number,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(session, userId, seasonId)
      ) : (
        <LayoutHtml>{page(session, userId, seasonId)}</LayoutHtml>
      )}
    </>
  );
}

async function page(session: Session | null, userId: string, seasonId: number) {
  const season = await getSeason(seasonId);
  const ratingSystem = getRatingSystem(season?.ratingSystem ?? "elo");

  const { elaspedTimeMs, result: matches } = await measure(() =>
    getMatches(seasonId, !!session?.user),
  );
  console.log(`player stats took ${elaspedTimeMs}ms to get from db`);
  const activeQuestsForProfile = await getActiveQuestsForPlayer(userId);
  const user = await getUser(userId, !!session?.user);
  let profileName = `Your stats - ${user?.nickname}`;
  if (!session || (session && session.user.id !== userId)) {
    if (user) {
      profileName = `${user.name}'s stats`;
    }
  }
  const header = profileName;
  const seasons = await getSeasons();
  const isOwnProfile = session?.user.id === userId;

  return (
    <>
      <NavbarHtml session={session} activePage="profile" />
      <div class="flex flex-row justify-between">
        {isOwnProfile && user ? (
          <FoldableCard title={header} doubleSize>
            <div class="flex w-full flex-col flex-wrap justify-between lg:flex-row">
              <ProfileForm
                curNickname={user.nickname}
                formId={user.id}
              ></ProfileForm>
            </div>
          </FoldableCard>
        ) : (
          <HeaderHtml title={header} />
        )}

        <div class="p-5">
          <SelectGet
            options={seasons.map((season) => ({
              path: `/profile/${userId}/season/${season.id}`,
              text: season.name,
            }))}
            selectedIndex={seasons.findIndex(
              (season) => season.id === seasonId,
            )}
          ></SelectGet>
        </div>
      </div>
      {profileQuests(activeQuestsForProfile)}
      {profileStats(matches, userId, ratingSystem)}
    </>
  );
}

const profileQuests = (profileQuests: Quest<unknown>[]) => {
  if (profileQuests.length === 0) {
    return <></>;
  }
  return (
    <>
      <div class="grid grid-cols-3 gap-3">
        <StatsCardHtml
          title={`Active Quests (${profileQuests.length}/${MaxQuestPerPlayer})`}
        >
          <>
            {profileQuests.map((quest) => {
              return (
                <div
                  id={quest.id}
                  class={cn(
                    "border-1 mb-3 flex w-full flex-col gap-3 rounded-md border p-4 shadow-md",
                    "lg:mb-[1%] lg:w-[49.5%]",
                  )}
                >
                  <QuestDescription quest={quest} />
                </div>
              );
            })}
          </>
        </StatsCardHtml>
      </div>
    </>
  );
};

const profileStats = (
  matches: Match[],
  userId: string,
  ratingSystem: RatingSystem<Rating>,
) => {
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
    MatchStatistics.getPlayersStreak(playerMatches, userId);

  const { easiestOpponents, hardestOpponents } =
    MatchStatistics.getPlayersEasiestAndHardestOpponents(matches, userId);

  const { win: biggestWin, loss: biggestLoss } =
    MatchStatistics.biggestWinAndLoss(matches, userId);

  const ratingHistory = MatchStatistics.getRatingHistory(
    matches,
    userId,
    ratingSystem,
  );
  const matchHistory = MatchStatistics.getMatchHistory(matches, userId)?.slice(
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

  const ratings = ratingHistory.map((x) => ratingSystem.toNumber(x.rating));
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
    <div class="grid grid-cols-6 gap-3 md:grid-cols-12">
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
            <Chart id="chartDoughnut" config={winrateConfig}></Chart>
            <span class="pl-3 text-sm">
              {winRate.winPercentage.toFixed(2)}%
            </span>
          </div>
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
            <Chart id="ratingChart" config={ratingTrendConfig}></Chart>
          </div>
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
      <MatchResultLink
        seasonId={biggestWin.match.seasonId}
        matchId={biggestWin.match.id}
      >
        {biggestWin.match.createdAt.toLocaleString("en-US", {
          day: "numeric",
          month: "long",
        })}
      </MatchResultLink>
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
      <MatchResultLink seasonId={match.seasonId} matchId={match.id}>
        {match.createdAt.toLocaleString("en-US", {
          day: "numeric",
          month: "long",
        })}
      </MatchResultLink>
      , <span class="font-bold">{firstTeam.join(" & ")}</span> faced off against{" "}
      <span class="font-bold">{lastTeam.join(" & ")}</span> and{" "}
      {result === RESULT.DRAW ? "tied" : result === RESULT.WIN ? "won" : "lost"}{" "}
      with {match.scoreDiff} points.
    </span>
  );
}
