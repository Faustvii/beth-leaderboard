import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class PlayMatchCountQuest extends BaseQuest<number, number> {
  type: QuestType = "PlayMatchCount";
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

    this.state++;

    if (this.state < this.conditionData) return "InProgress";

    return "Completed";
  }
}
