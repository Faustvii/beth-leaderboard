import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export class PlayMatchWithQuest extends BaseQuest<string, boolean> {
  type: QuestType = "PlayMatchWith";
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
    if (this.isPlayerInMatch(match, this.conditionData)) {
      const playersTeam = this.getPlayersTeam(match);
      const withPlayersTeam = this.getPlayersTeam(match, this.conditionData);
      if (withPlayersTeam == playersTeam) this.state = true;
    }

    if (!this.state) return "InProgress";

    return "Completed";
  }
}
