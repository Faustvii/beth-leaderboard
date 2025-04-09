import { generateRandomString } from "lucia/utils";
import { type readDb } from ".";
import { config } from "../config";
import { dayInMs, daysBetween, hourInMs } from "../lib/dateUtils";
import { isDefined, pick } from "../lib/utils";
import { getActiveSeason } from "./queries/seasonQueries";
import { matches, seasonsTbl, userTbl } from "./schema";
import { ratingEventTbl, type InsertRatingEvent } from "./schema/ratingEvent";
import { type InsertSeason } from "./schema/season";

export async function SeedPreprod(db: typeof readDb) {
  if (
    config.env.NODE_ENV === "preprod" &&
    config.env.DATABASE_CONNECTION_TYPE === "local"
  ) {
    console.log("starting database seeding");
    const activeSeason = await SeedSeason(db);
    if (!activeSeason) throw new Error("Wasn't able to seed an active season");
    const players = await SeedPlayers(db);
    await SeedMatches(db, activeSeason);
    await SeedQuestEvents(db, activeSeason, players);
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

async function SeedPlayers(
  db: typeof readDb,
): Promise<(typeof userTbl.$inferSelect)[]> {
  const seededPlayers: (typeof userTbl.$inferSelect)[] = [];
  for (let index = 0; index < 100; index++) {
    const playerId = generateRandomString(15);
    const player: typeof userTbl.$inferInsert = {
      id: playerId,
      name: `Player ${index}`,
      email: `fake${index}@fake.crokinole`,
      roles: index === 0 ? "admin" : "",
      picture:
        "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",
      nickname: `PNick${index}`,
    };
    await db.insert(userTbl).values(player);
    // Add the selectable version to the return array, ensuring null defaults
    seededPlayers.push({
      id: player.id,
      name: player.name,
      email: player.email ?? null,
      picture: player.picture ?? "",
      roles: player.roles ?? null,
      nickname: player.nickname ?? player.name, // Default nickname to name if null
    });
  }
  return seededPlayers;
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

async function SeedQuestEvents(
  db: typeof readDb,
  activeSeason: typeof seasonsTbl.$inferSelect,
  players: (typeof userTbl.$inferSelect)[],
) {
  console.log("Seeding quest events...");

  // Fetch a larger pool of recent matches to link events to
  const recentMatches = await db.query.matches.findMany({
    orderBy: (matches, { desc }) => [desc(matches.createdAt)],
    limit: 100, // Get last 100 matches
    where: (matches, { eq }) => eq(matches.seasonId, activeSeason.id),
  });

  if (recentMatches.length === 0) {
    console.warn(
      "No recent matches found to link quest events to. Skipping quest seeding.",
    );
    return;
  }

  const seasonId = activeSeason.id;
  const eventsToSeed: InsertRatingEvent[] = [];
  const questTypesToSeed = [
    // Only include types observed in the production CSV data
    "Quest_PlayMatchCountCompleted",
    "Quest_Play1v1Completed",
    "Quest_WinCountCompleted",
    "Quest_WinStreakCompleted",
    "Quest_WinByPointsCompleted",
    "Quest_PlayMatchCountFailed",
    "Quest_Play1v1Failed",
    "Quest_WinCountFailed",
    "Quest_WinStreakFailed",
    "Quest_WinByPointsFailed",
  ];

  const numEventsToSeed = 50; // Target number of events to create

  // Seed the target number of events, randomizing type, match, and player
  for (let i = 0; i < numEventsToSeed; i++) {
    // Randomly select a quest type for this event
    const questType =
      questTypesToSeed[Math.floor(Math.random() * questTypesToSeed.length)];

    // Pick a random match from the recent pool
    const selectedMatch =
      recentMatches[Math.floor(Math.random() * recentMatches.length)];
    const currentMatchId = selectedMatch.id; // ID of the match picked for this event
    const matchPlayerIds = [
      selectedMatch.whitePlayerOne,
      selectedMatch.whitePlayerTwo,
      selectedMatch.blackPlayerOne,
      selectedMatch.blackPlayerTwo,
    ].filter(isDefined);

    if (matchPlayerIds.length === 0) continue;

    // Pick a random player from this match for the event
    const eventPlayerId =
      matchPlayerIds[Math.floor(Math.random() * matchPlayerIds.length)];
    const eventPlayer = players.find((p) => p.id === eventPlayerId);
    if (!eventPlayer) continue;

    const isCompleted = questType.endsWith("Completed");
    let nestedDataPayload: string | object = ""; // Default payload

    // Determine nestedDataPayload based on questType structure from CSV
    switch (questType) {
      case "Quest_PlayMatchCountCompleted":
        nestedDataPayload = "2";
        break;
      case "Quest_Play1v1Completed":
        nestedDataPayload = "";
        break;
      case "Quest_WinCountCompleted":
        nestedDataPayload = "2";
        break;
      case "Quest_WinStreakCompleted":
        nestedDataPayload = "3";
        break;
      case "Quest_WinByPointsCompleted":
        nestedDataPayload = "85";
        break; // Example from CSV
      case "Quest_PlayMatchCountFailed":
        nestedDataPayload = "2";
        break;
      case "Quest_Play1v1Failed":
        nestedDataPayload = "";
        break;
      case "Quest_WinCountFailed":
        nestedDataPayload = "3";
        break;
      case "Quest_WinStreakFailed":
        nestedDataPayload = "3";
        break;
      case "Quest_WinByPointsFailed":
        nestedDataPayload = "100";
        break;
      default:
        console.warn(`Unhandled quest type for seeding payload: ${questType}`);
        continue;
    }

    // Construct the object to be stringified for the main data column (matching CSV structure)
    const dataObject = {
      type: questType,
      data: nestedDataPayload,
      playerId: eventPlayerId,
      questId: 0, // Placeholder questId
      matchId: isCompleted ? currentMatchId : 0, // MatchId inside data is 0 for failed quests
    };

    eventsToSeed.push({
      playerId: eventPlayerId,
      seasonId: seasonId,
      type: questType, // Main type is specific quest status
      matchId: isCompleted ? currentMatchId : null, // Main matchId is null for failed quests
      data: JSON.stringify(dataObject), // Stringify the object matching CSV structure
      createdAt: selectedMatch.createdAt,
    });
  }

  if (eventsToSeed.length > 0) {
    await db.insert(ratingEventTbl).values(eventsToSeed);
    console.log(
      `Seeded ${eventsToSeed.length} quest events linked to a pool of the last ${recentMatches.length} matches.`,
    );
  } else {
    console.log("No quest events to seed based on recent matches.");
  }
}
