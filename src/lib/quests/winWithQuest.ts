import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class WinWithQuest extends BaseQuest<string> {
  type: QuestType = "WinWith";
  hasWonWith = false;

  constructor(
    public conditionData: string,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.hasWonWith) {
      return "Completed";
    }
    if (!this.matchIsValidForQuest(match)) return "InProgress";

    const playersTeam = this.getPlayersTeam(match);
    if (match.result == playersTeam) {
      if (this.isPlayerInMatch(match, this.conditionData)) {
        const withPlayersTeam = this.getPlayersTeam(match, this.conditionData);
        if (withPlayersTeam == playersTeam) this.hasWonWith = true;
      }
    }

    if (!this.hasWonWith) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
