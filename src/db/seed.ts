import { generateRandomString } from "lucia/utils";
import { readDb, writeDb } from ".";
import { applyMatchResult, matchEloChange } from "../lib/elo";
import { type GameResult } from "../types/elo";
import { playerEloQuery } from "./queries/matchQueries";
import { getActiveSeason } from "./queries/seasonQueries";
import { matches, seasonsTbl, userTbl } from "./schema";
import { type InsertSeason } from "./schema/season";

type newPlayer = typeof userTbl.$inferInsert;
type newMatch = typeof matches.$inferInsert;
const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1).getTime() - 1;

const activeSeason = await getActiveSeason();
if (!activeSeason) {
  const now = new Date();
  const startAt = new Date(now.getFullYear(), 0, 1);
  const endAt = new Date(now.getFullYear() + 1, 0, 1);
  const season: InsertSeason = {
    name: `Season ${now.getFullYear()}}`,
    startAt: startAt,
    endAt: endAt,
  };
  console.log("Creating season", season);
  await readDb.insert(seasonsTbl).values(season);
}

for (let index = 0; index < 100; index++) {
  const player: newPlayer = {
    id: generateRandomString(15),
    name: `Player ${index}`,
    elo: 1500,
    email: "fake@fake.crokinole",
  };

  await readDb.insert(userTbl).values(player);
}

for (let index = 0; index < 1000; index++) {
  const players = await readDb.query.userTbl.findMany({
    columns: {
      id: true,
    },
  });
  if (index % 50 == 0) console.log("creating elo match " + index + " of 1000");

  const userIds = [
    players[Math.floor(Math.random() * players.length)].id,
    players[Math.floor(Math.random() * players.length)].id,
    players[Math.floor(Math.random() * players.length)].id,
    players[Math.floor(Math.random() * players.length)].id,
  ];

  const eloPlayers = userIds.map(async (id) => ({
    id: id,
    elo: await playerEloQuery(id, activeSeason?.id ?? 1),
  }));
  const whitePlayerOne = await eloPlayers[0];
  const whitePlayerTwo = await eloPlayers[1];
  const blackPlayerOne = await eloPlayers[2];
  const blackPlayerTwo = await eloPlayers[3];
  // Generate a random date within this year
  const matchDate = new Date(
    startOfYear + Math.random() * (endOfYear - startOfYear),
  );

  const result =
    Math.random() > 0.9 ? "Draw" : Math.random() > 0.5 ? "Black" : "White";
  //960 is 4 rounds of only 20 shots and all misses for opposite team
  const scoreDiff =
    result === "Draw" ? 0 : Math.min(Math.floor(Math.random() * 20) * 5, 960);
  const match: GameResult = {
    outcome: result === "Black" ? "loss" : result === "White" ? "win" : "draw",
    teams: [
      {
        color: "White",
        players: [
          {
            id: whitePlayerOne.id,
            elo: whitePlayerOne.elo,
          },
          {
            id: whitePlayerTwo.id,
            elo: whitePlayerTwo.elo,
          },
        ],
      },
      {
        color: "Black",
        players: [
          {
            id: blackPlayerOne.id,
            elo: blackPlayerOne.elo,
          },
          {
            id: blackPlayerTwo.id,
            elo: blackPlayerTwo.elo,
          },
        ],
      },
    ],
  };
  const eloChange = matchEloChange(match);
  applyMatchResult({ eloFloor: 0 }, match);

  const matchInsert: newMatch = {
    whitePlayerOne: whitePlayerOne.id,
    blackPlayerOne: blackPlayerOne.id,
    result: result,
    scoreDiff: scoreDiff,
    whiteEloChange: eloChange.white,
    blackEloChange: eloChange.black,
    whitePlayerTwo: whitePlayerTwo.id,
    blackPlayerTwo: blackPlayerTwo.id,
    createdAt: matchDate,
    seasonId: activeSeason?.id ?? 1,
  };

  await writeDb.insert(matches).values(matchInsert);
}
