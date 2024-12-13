import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class PlayMatchWithQuest extends BaseQuest<string> {
  type: QuestType = "PlayMatchWith";
  hasPlayedWith = false;

  constructor(
    public conditionData: string,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.hasPlayedWith) {
      return "Completed";
    }
    if (!this.baseMatchValidation(match)) return "InProgress";
    if (this.isPlayerInMatch(match, this.conditionData)) {
      const playersTeam = this.getPlayersTeam(match);
      const withPlayersTeam = this.getPlayersTeam(match, this.conditionData);
      if (withPlayersTeam == playersTeam) this.hasPlayedWith = true;
    }

    if (!this.hasPlayedWith) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
