import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class Play1v1Quest extends BaseQuest<string, boolean> {
  type: QuestType = "Play1v1";
  state = false;

  constructor(
    public conditionData: string,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.state) {
      return "Completed";
    }
    if (!this.matchIsValidForQuest(match)) return "InProgress";

    if (match.blackPlayerTwo == null && match.whitePlayerTwo == null)
      this.state = true;

    if (!this.state) return "InProgress";

    return "Completed";
  }
}
