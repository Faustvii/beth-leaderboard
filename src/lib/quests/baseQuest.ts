import MatchStatistics, { isPlayerInMatchFilter } from "../matchStatistics";
import {
  type Quest,
  type QuestEvent,
  type QuestStatus,
  type QuestType,
} from "../quest";
import { type Match } from "../rating";

export abstract class BaseQuest<TConditionData>
  implements Quest<TConditionData>
{
  public id = 0;
  public matchId = 0;
  abstract type: QuestType;

  constructor(
    public conditionData: TConditionData,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {}

  public reward(): QuestEvent<TConditionData> {
    return {
      type: `Quest_${this.type}Completed`,
      data: this.conditionData,
      playerId: this.playerId,
      questId: this.id,
      matchId: this.matchId,
    };
  }

  public penalty(): QuestEvent<TConditionData> {
    return {
      type: `Quest_${this.type}Failed`,
      data: this.conditionData,
      playerId: this.playerId,
      questId: this.id,
      matchId: this.matchId,
    };
  }

  abstract evaluate(match: Match): QuestStatus;

  protected setQuestCompletionData(match: Match) {
    this.matchId = match.id;
  }

  protected matchIsValidForQuest(match: Match): boolean {
    return this.isPlayerInMatch(match) && this.isMatchAfterQuestCreation(match);
  }

  protected isPlayerInMatch(
    match: Match,
    playerId: string = this.playerId,
  ): boolean {
    return isPlayerInMatchFilter(playerId)(match);
  }

  protected isMatchAfterQuestCreation(match: Match): boolean {
    return match.createdAt > this.createdAt;
  }

  protected getPlayersTeam(
    match: Match,
    playerId: string = this.playerId,
  ): "White" | "Black" {
    return MatchStatistics.getPlayersTeam(match, playerId);
  }
}
