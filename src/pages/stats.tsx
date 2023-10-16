import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { getMatchesWithPlayers } from "../db/queries/matchQueries";
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
      return await getMatchesWithPlayers();
    },
  );
  console.log("stats page database calls", elaspedTimeMs, "ms");

  const now = performance.now();
  const matches = mapToMatches(matchesWithPlayers);
  const matchesToday = MatchStatistics.gamesToday(matches);
  const drawMatches = MatchStatistics.draws(matches);
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

  const colorWinRate = MatchStatistics.whichColorWinsTheMost(matches);
  console.log("metrics took ", performance.now() - now + "ms  to run");

  return (
    <>
      <NavbarHtml session={session} activePage="stats" />
      <HeaderHtml title="Stats" />
      <HeaderHtml title="Someone make this pretty" />
      <div class="flex flex-col items-center">
        <span class="p-4">Total Games played {matches.length}</span>
        <span class="p-4">There has been draws {drawMatches} times</span>
        <span class="p-4">Games today {matchesToday}</span>
        {dayWithMostGames && (
          <span class="p-4">
            Most active day is{" "}
            {new Date(dayWithMostGames).toLocaleString("en-US", {
              day: "numeric",
              month: "long",
            })}{" "}
            with {mostGamesOnOneDay} games played
          </span>
        )}
        {biggestWin(matchesWithPlayers)}
        {highestWinStreak && (
          <span class="p-4">
            {highestWinStreak.player.name} has the highest win streak with{" "}
            {highestWinStreak.streak} wins in a row
          </span>
        )}
        {highestLoseStreak && (
          <span class="p-4">
            {highestLoseStreak.player.name} has the biggest losing streak with{" "}
            {highestLoseStreak.streak} losses in a row
          </span>
        )}
        {playerWithMostGames && (
          <span class="p-4">
            {playerWithMostGames.player.name} has played the most games with{" "}
            {playerWithMostGames.games} games played
          </span>
        )}
        {playerWithHighestWinRate && (
          <span class="p-4">
            {playerWithHighestWinRate.player.name} has the highest win rate with{" "}
            {(playerWithHighestWinRate.winrate * 100).toFixed(2)}% over{" "}
            {playerWithHighestWinRate.totalGames} games
          </span>
        )}
        {playerWithLowestWinRate && (
          <span class="p-4">
            {playerWithLowestWinRate.player.name} has the lowest win rate with{" "}
            {(playerWithLowestWinRate.winrate * 100).toFixed(2)}% over{" "}
            {playerWithLowestWinRate.totalGames} games
          </span>
        )}
        {colorWinRate && (
          <span class="p-4">
            {colorWinRate.color} wins {colorWinRate.winPercentage.toFixed(2)}%
            of the time
          </span>
        )}
      </div>
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
    <span class="p-4">
      Biggest win is {biggestWin} points between {biggestPlayers.white.join()} &{" "}
      {biggestPlayers.black.join(", ")} on{" "}
      {biggestWinMatch.createdAt.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
      })}
    </span>
  );
}
