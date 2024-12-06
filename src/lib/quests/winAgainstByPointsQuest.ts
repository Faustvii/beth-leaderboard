import { type QuestStatus, type QuestType } from "../quest";
import { BaseQuest } from "./baseQuest";

export interface WinAgainstByPointsConditionData {
  points: number;
  playerId: string;
}

export class WinAgainstByPointsQuest extends BaseQuest<WinAgainstByPointsConditionData> {
  type: QuestType = "WinAgainstByPoints";
  winAgainstPoints = false;

  constructor(
    public conditionData: WinAgainstByPointsConditionData,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {
    super(conditionData, playerId, createdAt, description);
  }

  evaluate(match: MatchWithPlayers): QuestStatus {
    if (this.winAgainstPoints) {
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
          this.winAgainstPoints = true;
        }
      }
    }

    if (!this.winAgainstPoints) return "InProgress";
    this.setQuestCompletionData(match);

    return "Completed";
  }
}
