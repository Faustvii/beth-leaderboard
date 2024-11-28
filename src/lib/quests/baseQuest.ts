import MatchStatistics, { isPlayerInMatchFilter } from "../matchStatistics";
import { type Quest, type QuestStatus, type QuestType } from "../quest";

export abstract class BaseQuest<TConditionData, TState>
  implements Quest<TConditionData, TState>
{
  abstract state: TState;
  abstract type: QuestType;

  constructor(
    public conditionData: TConditionData,
    public playerId: string,
    public createdAt: Date,
    public description: string,
  ) {}

  abstract evaluate(match: MatchWithPlayers): QuestStatus;

  protected matchIsValidForQuest(match: MatchWithPlayers): boolean {
    return this.isPlayerInMatch(match) && this.isMatchAfterQuestCreation(match);
  }

  protected isPlayerInMatch(
    match: MatchWithPlayers,
    playerId: string = this.playerId,
  ): boolean {
    return isPlayerInMatchFilter(playerId)(match);
  }

  protected isMatchAfterQuestCreation(match: MatchWithPlayers): boolean {
    return match.createdAt > this.createdAt;
  }

  protected getPlayersTeam(
    match: MatchWithPlayers,
    playerId: string = this.playerId,
  ): "White" | "Black" {
    return MatchStatistics.getPlayersTeam(match, playerId);
  }
}
