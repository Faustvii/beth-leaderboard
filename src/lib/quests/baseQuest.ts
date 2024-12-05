import MatchStatistics, { isPlayerInMatchFilter } from "../matchStatistics";
import {
  type Quest,
  type QuestEvent,
  type QuestStatus,
  type QuestType,
} from "../quest";
import { type Match } from "../rating";

export abstract class BaseQuest<TConditionData, TState>
  implements Quest<TConditionData, TState>
{
  public id = 0;
  abstract state: TState;
  abstract type: QuestType;

  constructor(
    public conditionData: TConditionData,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {}

  public reward(): QuestEvent<TConditionData> {
    return {
      type: `${this.type}Completed`,
      data: this.conditionData,
      playerId: this.playerId,
    };
  }

  public penalty(): QuestEvent<TConditionData> {
    return {
      type: `${this.type}Failed`,
      data: this.conditionData,
      playerId: this.playerId,
    };
  }

  abstract evaluate(match: Match): QuestStatus;

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
