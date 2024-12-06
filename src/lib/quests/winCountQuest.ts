import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class WinCountQuest extends BaseQuest<number> {
  type: QuestType = "WinCount";
  winCount = 0;

  constructor(
    public conditionData: number,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.winCount >= this.conditionData) {
      return "Completed";
    }
    if (!this.matchIsValidForQuest(match)) return "InProgress";

    const playersTeam = this.getPlayersTeam(match);
    if (match.result == playersTeam) {
      this.winCount++;
    }

    if (this.winCount < this.conditionData) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
