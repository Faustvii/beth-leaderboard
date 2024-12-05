import cron from "@elysiajs/cron";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { config } from "../config";
import { readDb, writeDb } from "../db";
import { getMatchesGreaterThanEqual } from "../db/queries/matchQueries";
import { getActiveSeason } from "../db/queries/seasonQueries";
import { questTbl } from "../db/schema";
import {
  ratingEventTbl,
  type InsertRatingEvent,
} from "../db/schema/ratingEvent";
import { notEmpty, unique } from "../lib";
import {
  QuestManager,
  type Quest,
  type QuestEvent,
  type QuestType,
} from "../lib/quest";
import { Play1v1Quest } from "../lib/quests/play1v1Quest";
import { PlayMatchCountQuest } from "../lib/quests/playMatchCountQuest";
import { MapQuests } from "../lib/quests/questMapper";
import { WinByPointsQuest } from "../lib/quests/winByPointsQuest";
import { WinCountQuest } from "../lib/quests/winCountQuest";
import { WinStreakQuest } from "../lib/quests/winStreakQuest";

export const questJobs = new Elysia().use(
  cron({
    name: "quest-schedule",
    pattern: config.env.NODE_ENV !== "production" ? "* * * * *" : "0 0 * * SUN",
    async run() {
      console.log("Checking progress of quests");
      const questManager = new QuestManager();
      const dbQuests = await readDb.query.questTbl.findMany();
      const mappedQuests = MapQuests(dbQuests);

      // Add existing quests to the quest manager
      for (const quest of mappedQuests) {
        questManager.addQuest(quest);
      }
      const today = new Date();
      today.setDate(today.getDate() - 21);
      const oldestMatchDate =
        dbQuests
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .shift()?.createdAt ?? today;

      console.log("Oldest match date: ", oldestMatchDate, dbQuests.length);

      // Evaluate all season matches against current quests
      const activeSeason = await getActiveSeason();
      if (!activeSeason) {
        console.log("No active season found");
        return;
      }
      const matchesForQuests = await getMatchesGreaterThanEqual(
        activeSeason.id,
        oldestMatchDate,
      );
      console.log("Matches for quests: ", matchesForQuests.length);
      for (const match of matchesForQuests) {
        questManager.handleMatch(match);
      }

      // Generate new quests
      const players = matchesForQuests
        .map((match) => [
          match.blackPlayerOne,
          match.blackPlayerTwo,
          match.whitePlayerOne,
          match.blackPlayerTwo,
        ])
        .flat()
        .filter(notEmpty)
        .filter(unique);

      const newQuests = generateQuests(players);
      // Add new quests to the quest manager
      for (const quest of newQuests) {
        questManager.addQuest(quest);
      }

      const failedQuests = questManager.getFailedQuests();
      const completedQuests = questManager.getCompletedQuests();

      for (const quest of failedQuests) {
        const questEvent = quest.penalty();
        await writeDb.transaction(async (trx) => {
          await trx.delete(questTbl).where(eq(questTbl.id, quest.id));
          await trx
            .insert(ratingEventTbl)
            .values(toInsertRatingEvent(questEvent, activeSeason.id));
        });
      }

      for (const quest of completedQuests) {
        const questEvent = quest.reward();
        await writeDb.transaction(async (trx) => {
          await trx.delete(questTbl).where(eq(questTbl.id, quest.id));
          await trx
            .insert(ratingEventTbl)
            .values(toInsertRatingEvent(questEvent, activeSeason.id));
        });
      }
    },
  }),
);

function toInsertRatingEvent(
  event: QuestEvent<unknown>,
  activeSeasonId: number,
): InsertRatingEvent {
  return {
    createdAt: new Date(),
    seasonId: activeSeasonId,
    playerId: event.playerId,
    data: JSON.stringify(event.data),
    type: event.type,
  };
}

function generateQuests(players: Player[]): Quest<unknown, unknown>[] {
  const quests = [];
  const questTypes: QuestType[] = [
    "PlayMatchCount",
    "Play1v1",
    "WinByPoints",
    "WinStreak",
    "WinCount",
  ];
  for (const player of players) {
    const type = questTypes[Math.floor(Math.random() * questTypes.length)];
    const playerQuest = generateQuest(player.id, type);
    quests.push(playerQuest);
  }
  return quests;
}

function generateQuest(
  playerId: string,
  type: QuestType,
): Quest<unknown, unknown> {
  switch (type) {
    case "PlayMatchCount":
      return new PlayMatchCountQuest(1, playerId, new Date(), "Play 1 match");
    case "Play1v1":
      return new Play1v1Quest("", playerId, new Date(), "Play a 1vs1 match");
    case "WinByPoints":
      return new WinByPointsQuest(
        50,
        playerId,
        new Date(),
        "Win a match by 50 points",
      );
    case "WinStreak":
      return new WinStreakQuest(
        3,
        playerId,
        new Date(),
        "Win 3 matches in a row",
      );
    case "WinCount":
      return new WinCountQuest(3, playerId, new Date(), "Win 3 matches");
    default:
      return new PlayMatchCountQuest(1, playerId, new Date(), "Play 1 match");
  }
}
