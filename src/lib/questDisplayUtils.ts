import { type ratingEventTbl } from "../db/schema/ratingEvent";
import { type QuestEvent, type QuestType } from "./quest";
import { questDescriptionGenerator } from "./quests/questDescriptionGenerator";
import { type Rating, type RatingSystem } from "./rating";

// Infer SelectRatingEvent type
type SelectRatingEvent = typeof ratingEventTbl.$inferSelect;

// Interface for the processed output
export interface ProcessedQuestDisplayItem {
  id: number;
  date: Date;
  description: string;
  questType: QuestType | null;
  outcome: "Completed" | "Failed" | "Unknown";
  bonusString: string;
  matchId: number | null;
  playerId: string;
}

// Shared function to process raw rating events
export function processQuestEventsForDisplay(
  ratingEvents: SelectRatingEvent[],
  ratingSystem: RatingSystem<Rating>,
): ProcessedQuestDisplayItem[] {
  return ratingEvents.map((event) => {
    let outcome: ProcessedQuestDisplayItem["outcome"] = "Unknown";
    let questType: QuestType | null = null;
    let conditionData: unknown = null;
    let description = "Unknown Event";
    let bonusString = "--";
    const matchIdFromEvent: number | null = event.matchId ?? null;
    const playerId = event.playerId ?? "";

    try {
      if (!playerId) throw new Error("Event is missing playerId");

      const parsedEventData = JSON.parse(
        event.data as string,
      ) as QuestEvent<unknown>;
      questType = parsedEventData.type
        .replace("Quest_", "")
        .replace(/Completed|Failed$/, "") as QuestType;
      conditionData = parsedEventData.data;
      description = questDescriptionGenerator(questType, conditionData);

      if (parsedEventData.type.endsWith("Completed")) {
        outcome = "Completed";
        if (ratingSystem.type === "xp") {
          const baseXP = 0;
          const xpAfterEvent = ratingSystem.applyEventAdjustment(
            baseXP,
            parsedEventData.type,
          ) as number;
          const bonus = xpAfterEvent - baseXP;
          bonusString = `${bonus > 0 ? "+" : ""}${bonus} XP`;
        } else {
          // Elo or OpenSkill
          const baseRatingNum = ratingSystem.toNumber(
            ratingSystem.defaultRating,
          );
          const ratingAfterEvent = ratingSystem.applyEventAdjustment(
            ratingSystem.defaultRating,
            parsedEventData.type,
          );
          const ratingAfterNum = ratingSystem.toNumber(ratingAfterEvent);
          const bonus = ratingAfterNum - baseRatingNum;
          bonusString = `${bonus > 0 ? "+" : ""}${bonus}`;
        }
      } else if (parsedEventData.type.endsWith("Failed")) {
        outcome = "Failed";
        if (ratingSystem.type === "xp") {
          const baseXP = 100;
          const xpAfterEvent = ratingSystem.applyEventAdjustment(
            baseXP,
            parsedEventData.type,
          ) as number;
          const penalty = xpAfterEvent - baseXP;
          bonusString = `${penalty}`;
        } else {
          // Elo or OpenSkill
          const baseRatingNum = ratingSystem.toNumber(
            ratingSystem.defaultRating,
          );
          const ratingAfterEvent = ratingSystem.applyEventAdjustment(
            ratingSystem.defaultRating,
            parsedEventData.type,
          );
          const ratingAfterNum = ratingSystem.toNumber(ratingAfterEvent);
          const penalty = ratingAfterNum - baseRatingNum;
          bonusString = `${penalty}`;
        }
      }
    } catch (error) {
      console.error(
        "Failed to process rating event for display:",
        error,
        event.data,
      );
      description = `Error processing event ID ${event.id}`;
      outcome = "Unknown";
    }

    return {
      id: event.id,
      date: event.createdAt,
      description,
      questType,
      outcome,
      bonusString,
      matchId: matchIdFromEvent,
      playerId,
    };
  });
}
