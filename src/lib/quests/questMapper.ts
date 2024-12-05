import { type Quest as DbQuest } from "../../db/schema/quest";
import { type Quest, type QuestType } from "../quest";
import { Play1v1Quest } from "./play1v1Quest";
import { PlayMatchCountQuest } from "./playMatchCountQuest";
import { PlayMatchWithQuest } from "./playMatchWithQuest";
import {
  WinAgainstByPointsQuest,
  type WinAgainstByPointsConditionData,
} from "./winAgainstByPointsQuest";
import { WinAgainstQuest } from "./winAgainstQuest";
import { WinByPointsQuest } from "./winByPointsQuest";
import { WinCountQuest } from "./winCountQuest";
import { WinStreakQuest } from "./winStreakQuest";
import { WinWithQuest } from "./winWithQuest";

export function MapQuests(quests: DbQuest[]): Quest<unknown, unknown>[] {
  return quests.map((quest) => {
    const questType = quest.type as QuestType;
    return MapQuestType(questType, quest);
  });
}

function MapQuestType(
  questType: QuestType,
  quest: DbQuest,
): Quest<unknown, unknown> {
  switch (questType) {
    case "PlayMatchCount":
      return new PlayMatchCountQuest(
        quest.conditionData as number,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "PlayMatchWith":
      return new PlayMatchWithQuest(
        quest.conditionData as string,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "Play1v1":
      return new Play1v1Quest(
        quest.conditionData as string,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "WinAgainstByPoints":
      return new WinAgainstByPointsQuest(
        quest.conditionData as WinAgainstByPointsConditionData,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "WinStreak":
      return new WinStreakQuest(
        quest.conditionData as number,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "WinCount":
      return new WinCountQuest(
        quest.conditionData as number,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "WinAgainst":
      return new WinAgainstQuest(
        quest.conditionData as string,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
    case "WinWith":
      return new WinWithQuest(
        quest.conditionData as string,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );

    case "WinByPoints":
      return new WinByPointsQuest(
        quest.conditionData as number,
        quest.playerId,
        quest.createdAt,
        quest.description,
      );
  }
}
