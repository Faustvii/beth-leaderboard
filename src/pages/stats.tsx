import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";
import { type readDb } from "../db";
import { matches } from "../db/schema";
import { getUnixDateFromDate, isHxRequest, notEmpty } from "../lib";

export const stats = new Elysia({
  prefix: "/stats",
})
  .use(ctx)
  .get("/", async ({ readDb, html, session, headers }) => {
    return html(() => statsPage(session, headers, readDb));
  });

async function statsPage(
  session: Session | null,
  headers: Record<string, string | null>,
  db: typeof readDb,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(db, session)
      ) : (
        <LayoutHtml>{page(db, session)}</LayoutHtml>
      )}
    </>
  );
}

async function page(db: typeof readDb, session: Session | null) {
  const matches = await db.query.matches.findMany();

  // const { elaspedTimeMs: matchTime, result: matches } = await measure(() =>
  //   db.query.matches.findMany(),
  // );
  // console.log("matches query took ", matchTime + "ms");
  const matchesToday = matches.filter(
    (mt) =>
      getUnixDateFromDate(mt.createdAt) === getUnixDateFromDate(new Date()),
  );

  const matchesPerDate = matches.reduce(
    (acc, curr) => {
      const date = new Date(
        curr.createdAt.getFullYear(),
        curr.createdAt.getMonth(),
        curr.createdAt.getDate(),
      ).getTime();
      if (!acc[date]) {
        acc[date] = 1;
      } else {
        acc[date] += 1;
      }
      return acc;
    },
    {} as Record<number, number>,
  );

  const mostGamesOnOneDay = Math.max(...Object.values(matchesPerDate));
  const drawMatches = matches.filter((mt) => mt.result === "Draw").length;

  const dayWithMostGames = Number(
    Object.keys(matchesPerDate).find(
      (key) => matchesPerDate[Number(key)] === mostGamesOnOneDay,
    ),
  );

  return (
    <>
      <NavbarHtml session={session} activePage="stats" />
      <HeaderHtml title="Stats" />
      <div class="flex flex-col items-center">
        <span class="p-4">Total Games played {matches.length}</span>
        <span class="p-4">There has been draws {drawMatches} times</span>
        <span class="p-4">Games today {matchesToday.length}</span>
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
        {biggestWin(db, matches)}
      </div>
    </>
  );
}
async function biggestWin(
  db: typeof readDb,
  matchess: {
    id: number;
    whitePlayerOne: string;
    whitePlayerTwo: string | null;
    blackPlayerOne: string;
    blackPlayerTwo: string | null;
    result: "Black" | "White" | "Draw";
    scoreDiff: number;
    eloChange: number;
    createdAt: Date;
  }[],
) {
  const biggestWin = Math.max(...matchess.map((mt) => mt.scoreDiff));
  const biggestWinMatch = matchess.find((mt) => mt.scoreDiff === biggestWin);
  if (!biggestWinMatch) return <></>;
  const now = performance.now();
  const biggestDbWin = await db.query.matches.findFirst({
    where: eq(matches.id, biggestWinMatch.id),
    with: {
      blackPlayerOne: true,
      blackPlayerTwo: true,
      whitePlayerOne: true,
      whitePlayerTwo: true,
    },
  });
  console.log("biggestDbWin query took ", performance.now() - now + "ms");
  if (!biggestDbWin) return <></>;

  const biggestPlayers = {
    black: [
      biggestDbWin.blackPlayerOne.name,
      biggestDbWin.blackPlayerTwo?.name,
    ].filter(notEmpty),
    white: [
      biggestDbWin.whitePlayerOne.name,
      biggestDbWin.whitePlayerTwo?.name,
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
