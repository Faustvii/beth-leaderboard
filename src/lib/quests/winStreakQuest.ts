import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class WinStreakQuest extends BaseQuest<number, number> {
  type: QuestType = "WinStreak";
  state = 0;

  constructor(
    public conditionData: number,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.state >= this.conditionData) {
      return "Completed";
    }
    if (!this.matchIsValidForQuest(match)) return "InProgress";

    const playersTeam = this.getPlayersTeam(match);
    if (match.result == playersTeam) {
      this.state++;
    } else {
      this.state = 0;
    }

    if (this.state < this.conditionData) return "InProgress";

    return "Completed";
  }
}
