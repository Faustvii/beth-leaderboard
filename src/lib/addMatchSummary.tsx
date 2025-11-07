import {
  fancyInBetweenText,
  matchhistoryDateToString,
} from "../pages/stats.tsx";
import { notEmpty } from "./index.ts";
import { type Match } from "./ratings/rating.ts";

export function addMatchSummary(match: Match) {
  const teamPlayers = {
    black: [
      match.blackPlayerOne.nickname,
      match.blackPlayerTwo?.nickname,
    ].filter(notEmpty),
    white: [
      match.whitePlayerOne.nickname,
      match.whitePlayerTwo?.nickname,
    ].filter(notEmpty),
  };

  let summary = "";
  switch (match.result) {
    case "Draw":
      summary = `${matchhistoryDateToString(match.createdAt)} ${teamPlayers.white.join(" & ")} drew with ${teamPlayers.black.join(" & ")}`;
      break;
    case "White":
      summary = `${matchhistoryDateToString(match.createdAt)} ${teamPlayers.white.join(" & ")} ${fancyInBetweenText(match.scoreDiff, teamPlayers.black.join(" & "))}`;
      break;
    case "Black":
      summary = `${matchhistoryDateToString(match.createdAt)} ${teamPlayers.black.join(" & ")} ${fancyInBetweenText(match.scoreDiff, teamPlayers.white.join(" & "))}`;
      break;
  }

  return { ...match, summary };
}
