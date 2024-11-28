import "@kitajs/html/register";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Elysia } from "elysia";
import { config } from "./config";
import { api } from "./controllers/*";
import { writeDb } from "./db";
import { SeedPreprod } from "./db/preprod";
import { QuestManager, type Quest } from "./lib/quest";
import { PlayMatchCountQuest } from "./lib/quests/playMatchCountQuest";
import { WinCountQuest } from "./lib/quests/winCountQuest";
import { WinStreakQuest } from "./lib/quests/winStreakQuest";
import { pages } from "./pages/*";
import { staticController } from "./staticFiles";
import { webSockets } from "./websockets/*";

console.log("migrating database");
await migrate(writeDb, { migrationsFolder: "./drizzle" });
console.log("database migrated");

const app = new Elysia()
  .use(webSockets)
  .use(staticController)
  .use(api)
  .use(pages)
  .onError(({ error }) => {
    console.error(error);
  })
  .listen(3000);
export type App = typeof app;

console.log(
  `app is listening on http://${app.server?.hostname}:${app.server?.port}`,
);

if (config.env.NODE_ENV === "preprod") {
  await SeedPreprod(writeDb);
}

// Test code
TestQuestFlow();

function TestQuestFlow() {
  const questManager = new QuestManager();
  const yesterday = new Date(new Date().getDate() - 1);
  const existingQuests = [
    new WinStreakQuest(3, "player1", yesterday, "Win 3 matches in a row"),
    new PlayMatchCountQuest(1, "player1", yesterday, "Play 3 match"),
    new WinCountQuest(3, "player1", yesterday, "Win 3 match"),
  ];
  for (const quest of existingQuests) {
    questManager.addQuest(quest);
  }
  const seasonMatches: MatchWithPlayers[] = [
    {
      blackPlayerOne: { id: "player1", name: "Player 1" },
      blackPlayerTwo: { id: "player2", name: "Player 2" },
      createdAt: new Date(),
      id: 1,
      result: "Black",
      scoreDiff: 1,
      seasonId: 1,
      whitePlayerOne: { id: "player3", name: "Player 3" },
      whitePlayerTwo: { id: "player4", name: "Player 4" },
    },
  ];

  for (const match of seasonMatches) {
    questManager.handleMatch(match);
  }

  const playersEgibleForQuests: Player[] = [
    { id: "player1", name: "Player 1" },
    { id: "player2", name: "Player 2" },
    { id: "player3", name: "Player 3" },
    { id: "player4", name: "Player 4" },
  ];
  for (const player of playersEgibleForQuests) {
    const quest = GenerateNewQuest(player);
    questManager.addQuest(quest);
  }

  const completedQuests = questManager.getCompletedQuests();
  const failedQuests = questManager.getFailedQuests();

  console.log("Completed quests:");
  console.table(completedQuests);
  console.log("Failed quests:");
  console.table(failedQuests);
}

function GenerateNewQuest(player: Player): Quest<unknown, unknown> {
  return new WinStreakQuest(3, player.id, new Date(), "Win 3 matches in a row");
}
