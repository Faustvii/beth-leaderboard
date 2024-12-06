import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class WinAgainstQuest extends BaseQuest<string> {
  type: QuestType = "WinAgainst";
  wonAgainst = false;

  constructor(
    public conditionData: string,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.wonAgainst) {
      return "Completed";
    }
    if (!this.matchIsValidForQuest(match)) return "InProgress";

    const playersTeam = this.getPlayersTeam(match);
    if (match.result == playersTeam) {
      if (this.isPlayerInMatch(match, this.conditionData)) {
        const againstPlayersTeam = this.getPlayersTeam(
          match,
          this.conditionData,
        );
        if (againstPlayersTeam != playersTeam) {
          this.wonAgainst = true;
        }
      }
    }

    if (!this.wonAgainst) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
