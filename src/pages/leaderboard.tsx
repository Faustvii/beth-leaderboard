import { Elysia } from "elysia";
import { LeaderboardRowHtml } from "../components/LeaderboardRow";
import { ctx } from "../context";

export const leaderboard = new Elysia({
  prefix: "/leaderboard",
})
  .use(ctx)
  .get("/page/:page", ({ html, params: { page } }) => {
    const pageNumber = parseInt(page);
    const rows = getRows(pageNumber);
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
  const rows = [];
  if (page === 1) page = 0;
  page = (page - 1) * 10;
  for (let i = 1; i <= 10; i++) {
    const calRank = i + page;
    rows.push({ rank: calRank, name: `test${calRank}`, elo: 3000 - calRank });
  }
  return rows;
}
