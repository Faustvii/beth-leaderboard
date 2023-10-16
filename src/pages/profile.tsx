import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { getMatchesWithPlayers } from "../db/queries/matchQueries";
import { getUserNoPicture } from "../db/queries/userQueries";
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
  if (!session?.user) throw new Error("no user");

  const { elaspedTimeMs, result: matchesWithPlayers } = await measure(() =>
    getMatchesWithPlayers(userId),
  );
  console.log(`player stats took ${elaspedTimeMs}ms to get from db`);
  let profileName = session.user.name;
  if (session.user.id !== userId) {
    const user = await getUserNoPicture(userId);
    if (user) profileName = user.name;
  }
  const header =
    session.user.id === userId ? "Your stats" : `${profileName}'s stats`;

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

  const draws = MatchStatistics.draws(matchesWithPlayers);
  const gamesInOneDay = MatchStatistics.mostGamesInOneDay(matchesWithPlayers);
  const colorWinRates = MatchStatistics.whichColorWinsTheMost(playerMatches);
  const winRate = MatchStatistics.playerWinRate(playerMatches, playerId);
  const gamesToday = MatchStatistics.gamesToday(matchesWithPlayers);
  const { highestLoseStreak, highestWinStreak } =
    MatchStatistics.getPlayersStreak(matchesWithPlayers, playerId);

  const { easiestOpponent, hardestOpponent } =
    MatchStatistics.getPlayersEasiestAndHardestOpponents(
      matchesWithPlayers,
      playerId,
    );

  const eloChanges = MatchStatistics.test(matchesWithPlayers, playerId);

  return (
    <div class="flex flex-col items-center">
      <div>You've played {matchesWithPlayers.length} games</div>
      <div>You've had {draws} draw(s)</div>
      <div>
        The most games you've played on one day is {gamesInOneDay.games} on{" "}
        {gamesInOneDay.date.toLocaleString("en-US", {
          day: "numeric",
          month: "long",
        })}
      </div>
      <div>
        You win the most with {colorWinRates.color} (
        {colorWinRates.winPercentage.toFixed(2)}%)
      </div>
      <div>your winrate is {winRate.toFixed(2)}%</div>
      <div>games today {gamesToday}</div>
      <div>
        Top win streak {highestWinStreak} and top lose streak is{" "}
        {highestLoseStreak}
      </div>
      <div>
        you win the most against {easiestOpponent?.player.name}, you have beat
        them {easiestOpponent?.games} times
      </div>
      <div>
        you lose the most against {hardestOpponent?.player.name}, you have lost
        to them {hardestOpponent?.games} times
      </div>
      <div>
        {eloChanges
          .filter((x) => x.eloChange !== 0)
          .map((eloChange) => {
            return (
              <div>
                {eloChange.date.toLocaleString("en-US", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                your elo changed by {eloChange.eloChange}
              </div>
            );
          })}
      </div>
    </div>
  );
};
