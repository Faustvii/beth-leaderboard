import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export interface WinAgainstByPointsConditionData {
  points: number;
  playerId: string;
}

export class WinAgainstByPointsQuest extends BaseQuest<
  WinAgainstByPointsConditionData,
  boolean
> {
  type: QuestType = "WinAgainstByPoints";
  state = false;

  constructor(
    public conditionData: WinAgainstByPointsConditionData,
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
      if (this.isPlayerInMatch(match, this.conditionData.playerId)) {
        const againstPlayersTeam = this.getPlayersTeam(
          match,
          this.conditionData.playerId,
        );
        if (
          againstPlayersTeam != playersTeam &&
          match.scoreDiff >= this.conditionData.points
        ) {
          this.state = true;
        }
      }
    }

    if (!this.state) return "InProgress";

    return "Completed";
  }
}
