import { notEmpty } from "./index.ts";
import type { Match } from "../lib/ratings/rating";
import { matchhistoryDateToString, fancyInBetweenText } from "../pages/stats";

interface WebhookPayload {
  event: "match.created";
  timestamp: string;
  match: {
    id: number;
    createdAt: string;
    result: string;
    scoreDiff: number;
    teams: {
      black: string[];
      white: string[];
    };
    winners: string[];
    losers: string[];
    prettyText: string;
  };
}

export function createMatchWebhookPayload(match: Match): WebhookPayload {
  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };

  let winners: string[] = [];
  let losers: string[] = [];
  let prettyText: string = "";

  switch (match.result) {
    case "Draw":
      winners = [];
      losers = [];
      prettyText = `${matchhistoryDateToString(match.createdAt)} ${teamPlayers.white.join(" & ")} drew with ${teamPlayers.black.join(" & ")}`;
      break;
    case "White":
      winners = teamPlayers.white;
      losers = teamPlayers.black;
      prettyText = `${matchhistoryDateToString(match.createdAt)} ${winners.join(" & ")} ${fancyInBetweenText(match.scoreDiff, losers.join(" & "))}`;
      break;
    case "Black":
      winners = teamPlayers.black;
      losers = teamPlayers.white;
      prettyText = `${matchhistoryDateToString(match.createdAt)} ${winners.join(" & ")} ${fancyInBetweenText(match.scoreDiff, losers.join(" & "))}`;
      break;
  }

  return {
    event: "match.created",
    timestamp: new Date().toISOString(),
    match: {
      id: match.id,
      createdAt: match.createdAt.toISOString(),
      result: match.result,
      scoreDiff: match.scoreDiff,
      teams: teamPlayers,
      winners,
      losers,
      prettyText,
    },
  };
}