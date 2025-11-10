import { matchhistoryDateToString } from "../pages/stats.tsx";
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
      summary = `${matchhistoryDateToString(match.createdAt)} ${teamPlayers.white.join(" & ")} ${skibidiInBetweenText(match.scoreDiff, teamPlayers.black.join(" & "))}`;
      break;
    case "Black":
      summary = `${matchhistoryDateToString(match.createdAt)} ${teamPlayers.black.join(" & ")} ${skibidiInBetweenText(match.scoreDiff, teamPlayers.white.join(" & "))}`;
      break;
  }

  return { ...match, summary };
}

export function fancyInBetweenText(scoreDiff: number, losers: string) {
  switch (true) {
    case scoreDiff > 200:
      return (
        "cleaned the floor winning by " +
        scoreDiff +
        " points humiliating " +
        losers +
        " for life"
      );
    case scoreDiff > 180:
      return "won by " + scoreDiff + " using their feet against " + losers;
    case scoreDiff > 160:
      return (
        "needs to call an &#128511 ambulance &#128511 for " +
        losers +
        " as they lost by " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 140:
      return "tryharded way too hard on " + losers + " winning by " + scoreDiff;
    case scoreDiff > 120:
      return (
        "absolutely scooby doo doo'd " +
        losers +
        " by winning with " +
        scoreDiff
      );
    case scoreDiff > 100:
      return (
        "found their inner Slater-power and smashed " +
        losers +
        " winnning by " +
        scoreDiff
      );
    case scoreDiff > 80:
      return (
        "took a well deserved breather while winning against " +
        losers +
        " with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 60:
      return (
        "comfortably manhandled " +
        losers +
        " winning with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 50:
      return (
        "got an undeserved victory against " +
        losers +
        " winning by pathetic " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 40:
      return (
        "won a hard fought battle against " +
        losers +
        " with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 30:
      return (
        "won by simply being better against " +
        losers +
        " winning by " +
        scoreDiff +
        " points"
      );
    case scoreDiff >= 20:
      return (
        "won by sheer luck against " + losers + " with " + scoreDiff + " points"
      );
    case scoreDiff >= 5:
      return (
        "got the tightest of tightest wins against " +
        losers +
        " winning by " +
        scoreDiff
      );
    default:
      return "won ? against ";
  }
}

export function skibidiInBetweenText(scoreDiff: number, losers: string) {
  switch (true) {
    case scoreDiff > 200:
      return (
        " went full sigma grindset on " +
        losers +
        " &#128128 and cooked them for " +
        scoreDiff +
        " points. shits cray cray"
      );
    case scoreDiff > 180:
      return (
        "tag-teamed " +
        losers +
        " like final bosses &#128293; — pure alpha energy " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 160:
      return (
        "cooked " +
        losers +
        " so hard, they respawned in Ohio &#128128 &#128293; dropping a diff of  " +
        scoreDiff +
        " points like it's nothing"
      );
    case scoreDiff > 140:
      return (
        "deleted " +
        losers +
        " off the map with " +
        scoreDiff +
        " points - literally a war crime"
      );
    case scoreDiff > 120:
      return (
        "humiliated " +
        losers +
        " on main &#127909;&#128514; — cooked up a " +
        scoreDiff +
        " point diff for real for real"
      );
    case scoreDiff > 110:
      return (
        "absolutely pulled up with a main character energy " +
        losers +
        " got side charactered with " +
        scoreDiff +
        " points, no cap"
      );
    case scoreDiff > 100:
      return (
        "caught " +
        losers +
        " lacking in 4K &#128249, that's a war crime with " +
        scoreDiff +
        " points"
      );
    case scoreDiff > 90:
      return (
        "absolutely demolished " +
        losers +
        " &#128165; - took it home with " +
        scoreDiff +
        " points, no cap"
      );
    case scoreDiff > 80:
      return (
        "gaslit, girlbossed & gatekeeped &#128131;&#128170; " +
        losers +
        " by " +
        scoreDiff +
        " points no cap"
      );
    case scoreDiff > 60:
      return (
        "made " +
        losers +
        " question their life choices - walked off with " +
        scoreDiff +
        " points like a menace &#128520;"
      );
    case scoreDiff > 50:
      return (
        "lowkey cooked " +
        losers +
        " for dinner - took it by " +
        scoreDiff +
        " points, no filter"
      );
    case scoreDiff > 45:
      return (
        "had all the skibidi rizz against " +
        losers +
        " and flexed a " +
        scoreDiff +
        " point win, no cap"
      );
    case scoreDiff > 40:
      return (
        "had " +
        losers +
        " fighting demons &#128128;&#128553; — still lost by " +
        scoreDiff +
        " points LMAO"
      );
    case scoreDiff > 35:
      return (
        "gaslit " +
        losers +
        " out of existence - cleaned " +
        scoreDiff +
        " points ahead &#128128;"
      );
    case scoreDiff > 30:
      return (
        "outplayed " +
        losers +
        "  while scrolling TikTok - secured a " +
        scoreDiff +
        " diff effortlessly"
      );
    case scoreDiff >= 25:
      return (
        " went alpha-lite mode on " +
        losers +
        " and dropped a " +
        scoreDiff +
        " diff like it's light work"
      );
    case scoreDiff >= 20:
      return (
        "dropped a mild menace win." +
        losers +
        " still crying, by losing with " +
        scoreDiff +
        " point diff"
      );
    case scoreDiff >= 10:
      return (
        "escaped defeat by " +
        losers +
        " &#128128; with " +
        scoreDiff +
        " points - core memory unlocked"
      );
    case scoreDiff >= 5:
    return (
      "got the tightest of toight wins against " +
      losers +
      " winning by " +
      scoreDiff
    );
    default:
      return "won ? against ";
  }
}
