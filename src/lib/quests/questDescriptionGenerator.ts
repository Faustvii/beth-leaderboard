import { type QuestType } from "../quest";
import { type WinAgainstByPointsConditionData } from "./winAgainstByPointsQuest";

export const questDescriptionGenerator = (
  questType: QuestType,
  conditionData: unknown,
) => {
  switch (questType) {
    case "WinStreak":
      return WinStreakQuestDescription(conditionData as number);
    case "WinCount":
      return WinCountQuestDescription(conditionData as number);
    case "WinByPoints":
      return WinByPointsQuestDescription(conditionData as number);
    case "WinAgainst":
      return WinAgainstQuestDescription(conditionData as string);
    case "WinAgainstByPoints":
      return WinAgainstByPointsQuestDescription(
        conditionData as WinAgainstByPointsConditionData,
      );
    case "WinWith":
      return WinWithQuestDescription(conditionData as string);
    case "PlayMatchCount":
      return PlayMatchCountQuestDescription(conditionData as number);
    case "PlayMatchWith":
      return PlayMatchWithQuestDescription(conditionData as string);
    case "Play1v1":
      return Play1v1QuestDescription();
    default:
      return "Unknown quest (Get help from admin)";
  }
};

// WinStreak Descriptions
function WinStreakQuestDescription(winStreakCount: number) {
  const possibleDescriptions = [
    `Achieve greatness with a ${winStreakCount}-match win streak!`,
    `Prove your skill by winning ${winStreakCount} matches in a row!`,
    `Can you handle the pressure? Win ${winStreakCount} consecutive matches!`,
  ];
  return randomDescription(possibleDescriptions);
}

// WinCount Descriptions
function WinCountQuestDescription(winCount: number) {
  const possibleDescriptions = [
    `Claim victory in ${winCount} ${pluralizedMatch(winCount)} to show your prowess!`,
    `Rack up ${winCount} ${pluralizedWin(winCount)} and assert your dominance!`,
    `Victory awaits! Win ${winCount} ${pluralizedMatch(winCount)} to complete the challenge!`,
  ];
  return randomDescription(possibleDescriptions);
}

// WinByPoints Descriptions
function WinByPointsQuestDescription(points: number) {
  const possibleDescriptions = [
    `Crush your opponent and win by ${points} points!`,
    `Show no mercy — secure a ${points}-point victory!`,
    `Dominate the scoreboard with a ${points}-point win!`,
  ];
  return randomDescription(possibleDescriptions);
}

function WinAgainstQuestDescription(playerId: string) {
  const possibleDescriptions = [
    `Defeat ${playerId} and claim your glory!`,
    `Take down ${playerId} to prove your might!`,
    `Show ${playerId} who the real champion is!`,
  ];
  return randomDescription(possibleDescriptions);
}

// WinAgainstByPoints Descriptions
function WinAgainstByPointsQuestDescription({
  playerId,
  points,
}: WinAgainstByPointsConditionData) {
  const possibleDescriptions = [
    `Overwhelm ${playerId} with a ${points}-point victory!`,
    `Conquer ${playerId} by outscoring them by ${points} points!`,
    `Show your dominance by defeating ${playerId} with a ${points}-point lead!`,
  ];
  return randomDescription(possibleDescriptions);
}

// WinWith Descriptions
function WinWithQuestDescription(playerId: string) {
  const possibleDescriptions = [
    `Team up with ${playerId} and secure a glorious victory!`,
    `Join forces with ${playerId} and crush your opponents!`,
    `Victory is sweeter when you win alongside ${playerId}!`,
  ];
  return randomDescription(possibleDescriptions);
}

// PlayMatchCount Descriptions
function PlayMatchCountQuestDescription(matchCount: number) {
  const possibleDescriptions = [
    `Step into the arena and play ${matchCount} ${pluralizedMatch(matchCount)}!`,
    `Get ready for action! Play ${matchCount} ${pluralizedMatch(matchCount)}!`,
    `The battle awaits — play ${matchCount} ${pluralizedMatch(matchCount)}!`,
  ];
  return randomDescription(possibleDescriptions);
}

// PlayMatchWith Descriptions
function PlayMatchWithQuestDescription(playerId: string) {
  const possibleDescriptions = [
    `Battle alongside ${playerId} and play a match together!`,
    `Team up with ${playerId} and step into the fray!`,
    `Enter the fight with ${playerId} by your side!`,
  ];
  return randomDescription(possibleDescriptions);
}

// Play1v1 Descriptions
function Play1v1QuestDescription() {
  const possibleDescriptions = [
    `Challenge someone to a 1v1 duel and prove your worth!`,
    `Enter the ring for a head-to-head 1v1 showdown!`,
    `Face off against a rival in an intense 1v1 battle!`,
  ];
  return randomDescription(possibleDescriptions);
}

// Utility function to randomly select a description
function randomDescription(descriptions: string[]) {
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function pluralizedMatch(matchCount: number) {
  return matchCount === 1 ? "match" : "matches";
}

function pluralizedWin(winCount: number) {
  return winCount === 1 ? "win" : "wins";
}
