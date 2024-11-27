import MatchStatistics, { isPlayerInMatchFilter } from "../matchStatistics";
import { QuestStatus, QuestType, type Quest } from "../quest";

export class WinCountQuest implements Quest<number, number> {
  type: QuestType = QuestType.WinCount;
  state = 0;

  constructor(
    public conditionData: number,
    public playerId: string,
    public createdAt: Date,
  ) {}

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.state >= this.conditionData) {
      return QuestStatus.Completed;
    }
    if (!isPlayerInMatchFilter(this.playerId)(match))
      return QuestStatus.InProgress;

    if (match.createdAt < this.createdAt) return QuestStatus.InProgress;

    const team = MatchStatistics.getPlayersTeam(match, this.playerId);
    if (match.result == team) {
      this.state++;
    }

    if (this.state < this.conditionData) return QuestStatus.InProgress;

    return QuestStatus.Completed;
  }

  description(): string {
    return `Win ${this.conditionData} times`;
  }

  reward(): number {
    return 10;
  }

  penalty(): number {
    return 5;
  }
}
