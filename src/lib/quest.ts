export interface Quest<TConditionData, TState> {
  type: QuestType;
  createdAt: Date;
  playerId: string;
  conditionData: TConditionData;
  state: TState;
  description: string;
  evaluate: (match: MatchWithPlayers) => QuestStatus;
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

export type QuestStatus = "InProgress" | "Completed" | "Failed";

export class QuestManager<TCondition, TState> {
  private activeQuests: Quest<TCondition, TState>[] = [];
  private completedQuests: Quest<TCondition, TState>[] = [];
  private failedQuests: Quest<TCondition, TState>[] = [];
  private playerQuests: Record<string, Quest<TCondition, TState>[]> = {};
  private maxQuestsPerPlayer = 3;

  addQuest(quest: Quest<TCondition, TState>): void {
    if (!this.playerQuests[quest.playerId]) {
      this.playerQuests[quest.playerId] = [];
    }
    if (this.playerQuests[quest.playerId].length >= this.maxQuestsPerPlayer) {
      const failedQuest = this.playerQuests[quest.playerId].shift();
      if (failedQuest) this.failedQuests.push(failedQuest);
    }

    this.activeQuests.push(quest);
    this.playerQuests[quest.playerId].push(quest);
  }

  handleMatch(match: MatchWithPlayers): void {
    const completedQuests = this.activeQuests.filter(
      (quest) => quest.evaluate(match) === "Completed",
    );
    this.completedQuests.push(...completedQuests);

    this.activeQuests = this.activeQuests.filter((q) =>
      this.completedQuests.includes(q),
    );
  }

  getActiveQuests(): Quest<TCondition, TState>[] {
    return this.activeQuests;
  }

  getCompletedQuests(): Quest<TCondition, TState>[] {
    return this.completedQuests;
  }

  getFailedQuests(): Quest<TCondition, TState>[] {
    return this.failedQuests;
  }
}
