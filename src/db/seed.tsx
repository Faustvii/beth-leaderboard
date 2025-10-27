import { count } from "drizzle-orm";
import { generateRandomString } from "lucia/utils";
import { type readDb } from ".";
import { config } from "../config";
import { dayInMs, daysBetween, hourInMs } from "../lib/dateUtils";
import { pick } from "../lib/utils";
import { getActiveSeason } from "./queries/seasonQueries";
import { matches, seasonsTbl, userTbl } from "./schema";
import { type InsertSeason } from "./schema/season";

export async function SeedDatabase(db: typeof readDb) {
  if (config.env.DATABASE_CONNECTION_TYPE === "local") {
    const matchCountResult = await db.select({ count: count() }).from(matches);
    const matchCount = matchCountResult[0]?.count ?? 0;
    if (matchCount > 0) {
      console.log("database has matches, skipping seeding");
      return;
    }

    console.log("starting database seeding");
    const activeSeason = await SeedSeason(db);
    if (!activeSeason) throw new Error("Wasn't able to seed an active season");
    await SeedPlayers(db);
    await SeedMatches(db, activeSeason);
    console.log("database seeding complete");
  }
}

async function SeedSeason(db: typeof readDb) {
  const activeSeason = await getActiveSeason();
  if (!activeSeason) {
    const now = new Date();
    const startAt = new Date(now.getFullYear(), 0, 1);
    const endAt = new Date(now.getFullYear() + 1, 0, 1);
    const season: InsertSeason = {
      name: `Season ${now.getFullYear()}`,
      startAt: startAt,
      endAt: endAt,
    };
    console.log("Creating season", season);
    await db.insert(seasonsTbl).values(season);
    return await getActiveSeason();
  }
  return activeSeason;
}

async function SeedPlayers(db: typeof readDb) {
  for (let index = 0; index < 100; index++) {
    const player: typeof userTbl.$inferInsert = {
      id: generateRandomString(15),
      name: `Player ${index}`,
      email: `fake${index}@fake.crokinole`,
      roles: index === 0 ? "admin" : "",
      picture: "../../public/crokinole.svg",
      nickname: `PNick${index}`,
    };

    await db.insert(userTbl).values(player);
  }
}

async function SeedMatches(
  db: typeof readDb,
  activeSeason: typeof seasonsTbl.$inferSelect,
) {
  const now = new Date();
  const daysSinceSeasonStart = daysBetween(activeSeason.startAt, now);

  const aproximateCountToGenerate = 1000;
  const extraMatchCount = aproximateCountToGenerate % daysSinceSeasonStart;
  const countToGenerate = aproximateCountToGenerate - extraMatchCount;

  const countPerDay = countToGenerate / daysSinceSeasonStart;

  for (let index = 0; index < countToGenerate; index++) {
    const players = await db.query.userTbl.findMany({
      columns: {
        id: true,
      },
    });
    if (index % 50 == 0)
      console.log("creating match " + index + " of " + countToGenerate);

    const userIds = pick(players, 4);

    const whitePlayerOne = userIds[0].id;
    const whitePlayerTwo = userIds[1].id;
    const blackPlayerOne = userIds[2].id;
    const blackPlayerTwo = userIds[3].id;

    // Generate a date that is evenly distributed between start of season and today and a time between 9:00 and 15:00
    const matchDate =
      activeSeason.startAt.getTime() +
      Math.floor(index / countPerDay) * dayInMs;
    const matchTime =
      (9 + ((index % countPerDay) / countPerDay) * 6) * hourInMs;
    const matchTimestamp = new Date(matchDate + matchTime);

    const result =
      Math.random() > 0.9 ? "Draw" : Math.random() > 0.5 ? "Black" : "White";
    //960 is 4 rounds of only 20 shots and all misses for opposite team
    const scoreDiff =
      result === "Draw" ? 0 : Math.min(Math.floor(Math.random() * 40) * 5, 960);

    const matchInsert: typeof matches.$inferInsert = {
      whitePlayerOne: whitePlayerOne,
      blackPlayerOne: blackPlayerOne,
      result: result,
      scoreDiff: scoreDiff,
      whitePlayerTwo: whitePlayerTwo,
      blackPlayerTwo: blackPlayerTwo,
      createdAt: matchTimestamp,
      seasonId: activeSeason?.id ?? 1,
    };

    await db.insert(matches).values(matchInsert);
  }
}
