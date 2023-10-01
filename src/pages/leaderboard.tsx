import { faker } from "@faker-js/faker";
import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { lucia } from "lucia";
import { generateRandomString } from "lucia/utils";
import { auth } from "../auth";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { ctx } from "../context";
import { user } from "../db/schema";
import { syncIfLocal } from "../lib";

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/page/:page", async ({ db, html, params: { page } }) => {
    const pageNumber = parseInt(page);

    // const rowPeople = getRows(pageNumber);
    // await db.insert(user).values(
    //   rowPeople.map((row) => ({
    //     id: generateRandomString(15),
    //     name: row.name,
    //     elo: row.elo,
    //     picture: "fake.svg",
    //     email: "fake@crokinole.faker",
    //   })),
    // );
    // await syncIfLocal();
    const now = performance.now();
    const players = await db.query.user.findMany({
      orderBy: [desc(user.elo)],
      limit: 10,
      offset: (pageNumber - 1) * 10,
    });
    console.log(`retrieved players in ${performance.now() - now}ms`);
    const rows = players.map((player, index) => ({
      rank: index + (pageNumber - 1) * 10 + 1,
      name: player.name,
      elo: player.elo,
    }));
    // console.log(rows);
    return html(() => (
      <>
        {rows.map((row, index) => (
          <LeaderboardRowHtml
            {...row}
            last={index === rows.length - 1}
            page={pageNumber}
          />
        ))}
      </>
    ));
  });

function getRows(page: number) {
  const rows: { rank: number; name: string; elo: number }[] = [];
  if (page === 11) return rows;
  if (page === 1) page = 0;
  page = (page - 1) * 10;
  for (let i = 1; i <= 100; i++) {
    const calRank = i + page;
    rows.push({
      rank: calRank,
      name: `${faker.person.fullName()}`,
      elo: 3000 - calRank,
    });
  }
  return rows;
}
