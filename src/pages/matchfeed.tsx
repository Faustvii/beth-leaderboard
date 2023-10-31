import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { MatchesHtml } from "../components/Matches";
import { MatchItemHtml } from "../components/MatchItem";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { readDb } from "../db";
import { matches } from "../db/schema";
import { type Match } from "../db/schema/matches";
import { isHxRequest, notEmpty, unique } from "../lib";

export const matchesPaginationQuery = async (
  page: number,
): Promise<MatchWithPlayers[]> => {
  const pageSize = 15;
  const games = await readDb.query.matches.findMany({
    orderBy: [desc(matches.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const userIds: string[] = games
    .flatMap((match: Match) => [
      match.blackPlayerOne,
      match.blackPlayerTwo,
      match.whitePlayerOne,
      match.whitePlayerTwo,
    ])
    .filter(notEmpty)
    .filter(unique);

  const matchesPlayed: Match[] =
    userIds.length === 0
      ? []
      : await readDb.query.matches.findMany({
          where: {
            OR: [
              { blackPlayerOne: { in: userIds } },
              { blackPlayerTwo: { in: userIds } },
              { whitePlayerOne: { in: userIds } },
              { whitePlayerTwo: { in: userIds } },
            ],
          },
        });

  const players: { id: string; name: string; username: string; elo: number }[] =
    userIds.length === 0
      ? []
      : await readDb.query.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            username: true,
            elo: true,
          },
        });

  const test: MatchWithPlayers[] = matchesPlayed.map((game: Match) => {
    const blackPlayerOne = players.find(
      (player) => player.id === game.blackPlayerOne,
    )!;
    const blackPlayerTwo =
      players.find((player) => player.id === game.blackPlayerTwo) || null;
    const whitePlayerOne = players.find(
      (player) => player.id === game.whitePlayerOne,
    )!;
    const whitePlayerTwo =
      players.find((player) => player.id === game.whitePlayerTwo) || null;

    return {
      ...game,
      blackPlayerOne,
      blackPlayerTwo,
      whitePlayerOne,
      whitePlayerTwo,
    };
  });

  return test;
};

export const matchfeed = new Elysia({
  prefix: "/matches",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => MatchFeedPage(session, headers));
  })
  .get("/page/:page", ({ html, params: { page } }) =>
    html(PagedMatchFeed(page)),
  );

export async function MatchFeedPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  const games = await matchesPaginationQuery(1);
  return (
    <>
      {isHxRequest(headers) ? (
        MatchFeedContainer(session, games)
      ) : (
        <LayoutHtml>{MatchFeedContainer(session, games)}</LayoutHtml>
      )}
    </>
  );
}

function MatchFeedContainer(
  session: Session | null,
  games: {
    id: number;
    whitePlayerOne: string;
    whitePlayerTwo: string | null;
    blackPlayerOne: string;
    blackPlayerTwo: string | null;
    result: "Black" | "White" | "Draw";
    scoreDiff: number;
    whiteEloChange: number;
    blackEloChange: number;
    createdAt: Date;
  }[],
): JSX.Element {
  return (
    <>
      <NavbarHtml session={session} activePage="matchfeed" />
      <HeaderHtml title="Matches" />
      <MatchesHtml page={1} games={games} />
    </>
  );
}

export async function PagedMatchFeed(page: string) {
  const pageNumber = parseInt(page);
  const matches: Match[] = await matchesPaginationQuery(pageNumber);

  return (
    <div class="flex flex-col gap-3 ">
      {matches.map((game, index) => (
        <MatchItemHtml game={game} first={index === 0} page={pageNumber} />
      ))}
    </div>
  );
}
