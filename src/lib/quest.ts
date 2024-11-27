import { type Rating } from "./rating";

export interface Quest<TConditionData, TState> {
  type: QuestType;
  conditionData: TConditionData;
  createdAt: Date;
  playerId: string;
  state: TState;
  description: () => string;
  evaluate: (event: MatchWithPlayers) => QuestStatus;
  reward: () => Rating;
  penalty: () => Rating;
}

export enum QuestType {
  WinStreak = "WinStreak", // Win X times in a row
  WinCount = "WinCount", // Win X times
  WinByPoints = "WinByPoints", // Win by more than X points
  WinAgainst = "WinAgainst", // Win against specific opponent(s)
  WinAgainstByPoints = "WinAgainstByPoints", // Win against specific opponent(s) by more than X points
  WinWith = "WinWith", // Win with specific player(s)
  PlayMatch = "PlayMatch", // Play a match
  PlayMatchCount = "PlayMatchCount", // Play X matches
  PlayMatchWith = "PlayMatchWith", // Play a match with specific player(s)
}

export enum QuestStatus {
  InProgress = "InProgress",
  Completed = "Completed",
  Failed = "Failed",
}

export class QuestManager<TCondition, TState> {
  private activeQuests: Quest<TCondition, TState>[] = [];
  private failedQuests: Quest<TCondition, TState>[] = [];
  private playerQuests: Record<string, Quest<TCondition, TState>[]> = {};
  private maxQuestsPerPlayer = 3;

  addQuest(quest: Quest<TCondition, TState>): void {
    this.activeQuests.push(quest);
    if (!this.playerQuests[quest.playerId]) {
      this.playerQuests[quest.playerId] = [];
    }
    if (this.playerQuests[quest.playerId].length >= this.maxQuestsPerPlayer) {
      const failedQuest = this.playerQuests[quest.playerId].shift();
      if (failedQuest) this.failedQuests.push(failedQuest);
    }
    this.playerQuests[quest.playerId].push(quest);
  }

  handleMatch(match: MatchWithPlayers): void {
    const completedQuests: Quest<TCondition, TState>[] = [];

    this.activeQuests.forEach((quest) => {
      if (quest.evaluate(match) === QuestStatus.Completed) {
        completedQuests.push(quest);
      }
    });

    completedQuests.forEach((quest) => this.completeQuest(quest));
  }

  private completeQuest(quest: Quest<TCondition, TState>): void {
    console.log(`Quest Completed: ${quest.description()}`);
    console.log(`Reward: `, quest.reward());
    this.activeQuests = this.activeQuests.filter((q) => q !== quest);
  }

  getActiveQuests(): Quest<TCondition, TState>[] {
    return this.activeQuests;
  }
}
