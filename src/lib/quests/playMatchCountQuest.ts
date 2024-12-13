import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class PlayMatchCountQuest extends BaseQuest<number> {
  type: QuestType = "PlayMatchCount";
  matchesPlayed = 0;

  constructor(
    public conditionData: number,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.matchesPlayed >= this.conditionData) {
      return "Completed";
    }
    if (!this.baseMatchValidation(match)) return "InProgress";

    this.matchesPlayed++;

    if (this.matchesPlayed < this.conditionData) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
