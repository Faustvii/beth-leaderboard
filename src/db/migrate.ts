import { generateRandomString } from "lucia/utils";
import { writeDb } from ".";
import { matches, user } from "./schema";

type newPlayer = typeof user.$inferInsert;
type newMatch = typeof matches.$inferInsert;

const userEloFile = Bun.file("src/db/data/Statistics.csv");
const userEloData = await userEloFile.text();
const userEloLines = userEloData.split("\n");
const userEloValues = userEloLines.slice(1).map((line) => line.split(","));
const userElos = userEloValues.map((userElo) => {
  return {
    userId: userElo[1].replaceAll('"', ""),
    elo: parseInt(userElo[2].replaceAll('"', "")),
  };
});

const userFile = Bun.file("src/db/data/User.csv");
const userData = await userFile.text();
const userLines = userData.split("\n");
const userValues = userLines.slice(1).map((line) => line.split(","));
const playersToMigrate: Record<string, newPlayer> = {};

userValues.map((user) => {
  const player: newPlayer = {
    id: generateRandomString(15),
    name: user[1].replaceAll('"', ""),
    elo:
      userElos.find((x) => x.userId === user[0].replaceAll('"', ""))?.elo ?? 1,
    picture: user[4].replaceAll('"', ""),
    email: user[2].replaceAll('"', ""),
  };
  playersToMigrate[user[0].replaceAll('"', "")] = player;
});

const userGameFile = Bun.file("src/db/data/UserGame.csv");
const userGameData = await userGameFile.text();
const userGameLines = userGameData.split("\n");
const userGameValues = userGameLines.slice(1).map((line) => line.split(","));
const gamePlayers = userGameValues.map((userGame) => {
  return {
    gameId: userGame[2].replaceAll('"', "").replace("\r", ""),
    color: userGame[0].replaceAll('"', "") === "WHITE" ? "White" : "Black",
    userId: userGame[1].replaceAll('"', ""),
  };
});

const gameFile = Bun.file("src/db/data/Game.csv");
const gameData = await gameFile.text();
const gameLines = gameData.split("\n");
const gameValues = gameLines.slice(1).map((line) => line.split(","));
const matchesToMigrate: newMatch[] = gameValues.map((game) => {
  const gameResult = game[2].replaceAll('"', "");
  const gameId = game[0].replaceAll('"', "");
  const players = gamePlayers.filter((x) => x.gameId === gameId);
  const whitePlayers = players.filter((x) => x.color === "White");
  const blackPlayers = players.filter((x) => x.color === "Black");
  const match: newMatch = {
    scoreDiff: parseInt(game[3].replaceAll('"', "")),
    createdAt: new Date(game[5].replaceAll('"', "")),
    result:
      gameResult === "DRAW"
        ? "Draw"
        : gameResult === "WHITE"
        ? "White"
        : "Black",
    whitePlayerOne: playersToMigrate[whitePlayers[0].userId].id,
    whitePlayerTwo:
      whitePlayers.length == 2
        ? playersToMigrate[whitePlayers[1].userId].id
        : null,
    blackPlayerOne: playersToMigrate[blackPlayers[0].userId].id,
    blackPlayerTwo:
      blackPlayers.length == 2
        ? playersToMigrate[blackPlayers[1].userId].id
        : null,
    whiteEloChange: 0,
    blackEloChange: 0,
  };
  return match;
});

// console.log(matchesToMigrate);

// console.log("migrating players", playersToMigrate);

for (const player of Object.values(playersToMigrate)) {
  await writeDb
    .insert(user)
    .values(player)
    .onConflictDoUpdate({ target: user.id, set: { elo: player.elo } });
  await Bun.sleep(250);
}

for (const match of matchesToMigrate) {
  await writeDb.insert(matches).values(match).onConflictDoNothing();
  await Bun.sleep(250);
}
