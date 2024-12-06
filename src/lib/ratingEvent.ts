import { type InsertRatingEvent } from "../db/schema/ratingEvent";
import { type QuestEvent } from "./quest";

export function toInsertRatingEvent(
  event: QuestEvent<unknown>,
  activeSeasonId: number,
): InsertRatingEvent {
  return {
    createdAt: new Date(),
    seasonId: activeSeasonId,
    playerId: event.playerId,
    data: JSON.stringify(event),
    type: event.type,
    matchId: event.matchId == 0 ? null : event.matchId,
  };
}
