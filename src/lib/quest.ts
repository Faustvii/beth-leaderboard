import { isNull } from "drizzle-orm";
import { readDb } from "../db";
import { questTbl, type InsertQuest } from "../db/schema/quest";
import { MapQuests } from "./quests/questMapper";
import { type Match } from "./rating";

export interface Quest<TConditionData> {
  id: number;
  type: QuestType;
  createdAt: Date;
  playerId: string;
  conditionData: TConditionData;
  description: string;
  evaluate: (match: Match) => QuestStatus;
  reward(): QuestEvent<TConditionData>;
  penalty(): QuestEvent<TConditionData>;
}

export interface QuestEvent<TConditionData> {
  type: QuestEventType;
  playerId: string;
  data: TConditionData;
  matchId: number;
  questId: number;
}

export type QuestType =
  | "WinStreak" // Win X matches in a row
  | "WinCount" // Win X matches
  | "WinByPoints" // Win a match by X points
  | "WinAgainst" // Win against a specific player
  | "WinAgainstByPoints" // Win against a specific player by X points
  | "WinWith" // Win with a specific player
  | "PlayMatchCount" // Play X matches
  | "PlayMatchWith" // Play a match with a specific player
  | "Play1v1"; // Play a 1v1 match

export type QuestEventType = `Quest_${QuestType}${"Failed" | "Completed"}`;
export type QuestStatus = "InProgress" | "Completed" | "Failed";

export class QuestManager<TCondition> {
  private activeQuests: Quest<TCondition>[] = [];
  private completedQuests: Quest<TCondition>[] = [];
  private failedQuests: Quest<TCondition>[] = [];
  private maxQuestsPerPlayer = 3;

  addQuest(quest: Quest<TCondition>): void {
    const playerQuests = this.activeQuests
      .filter((q) => q.playerId === quest.playerId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (playerQuests.length + 1 > this.maxQuestsPerPlayer) {
      const failedQuest = playerQuests[0];
      if (!failedQuest) return;
      this.activeQuests = this.activeQuests.filter((q) => q !== failedQuest);

      this.failedQuests.push(failedQuest);
    }

    this.activeQuests.push(quest);
  }

  handleMatch(match: Match): void {
    const completedQuests = this.activeQuests.filter(
      (quest) => quest.evaluate(match) === "Completed",
    );
    this.completedQuests.push(...completedQuests);

    this.activeQuests = this.activeQuests.filter(
      (q) => !this.completedQuests.includes(q),
    );
  }

  getActiveQuests(): Quest<TCondition>[] {
    return this.activeQuests;
  }

  getCompletedQuests(): Quest<TCondition>[] {
    return this.completedQuests;
  }

  getFailedQuests(): Quest<TCondition>[] {
    return this.failedQuests;
  }
}

export async function handleQuestsAfterLoggedMatch(
  matchesForQuests: MatchWithPlayers[],
) {
  const questManager = new QuestManager();
  const dbQuests = await readDb.query.questTbl.findMany({
    where: isNull(questTbl.resolvedAt),
  });
  const mappedQuests = MapQuests(dbQuests);
  for (const quest of mappedQuests) {
    questManager.addQuest(quest);
  }
  const sortedMatches = matchesForQuests.toSorted(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (const match of sortedMatches) {
    questManager.handleMatch(match);
  }
  return questManager.getCompletedQuests();
}

export function toInsertQuest(quest: Quest<unknown>): InsertQuest {
  return {
    type: quest.type,
    createdAt: quest.createdAt,
    playerId: quest.playerId,
    conditionData: JSON.stringify(quest.conditionData),
    description: quest.description,
  };
}
