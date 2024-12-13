import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class WinStreakQuest extends BaseQuest<number> {
  type: QuestType = "WinStreak";
  winStreakCount = 0;

  constructor(
    public conditionData: number,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.winStreakCount >= this.conditionData) {
      return "Completed";
    }
    if (!this.baseMatchValidation(match)) return "InProgress";

    const playersTeam = this.getPlayersTeam(match);
    if (match.result == playersTeam) {
      this.winStreakCount++;
    } else {
      this.winStreakCount = 0;
    }

    if (this.winStreakCount < this.conditionData) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
