import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class Play1v1Quest extends BaseQuest<string> {
  type: QuestType = "Play1v1";
  hasPlayed = false;

  constructor(
    public conditionData: string,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.hasPlayed) {
      return "Completed";
    }
    if (!this.baseMatchValidation(match)) return "InProgress";

    if (match.blackPlayerTwo == null && match.whitePlayerTwo == null)
      this.hasPlayed = true;

    if (!this.hasPlayed) return "InProgress";
    this.setQuestCompletionData(match);
    return "Completed";
  }
}
