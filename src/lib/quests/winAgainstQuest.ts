import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class WinAgainstQuest extends BaseQuest<string, boolean> {
  type: QuestType = "WinAgainst";
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

    const playersTeam = this.getPlayersTeam(match);
    if (match.result == playersTeam) {
      if (this.isPlayerInMatch(match, this.conditionData)) {
        const againstPlayersTeam = this.getPlayersTeam(
          match,
          this.conditionData,
        );
        if (againstPlayersTeam != playersTeam) {
          this.state = true;
        }
      }
    }

    if (!this.state) return "InProgress";

    return "Completed";
  }
}
