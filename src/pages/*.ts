import Elysia from "elysia";
import { home } from "./(home)";
import { leaderboard } from "./leaderboard";
import { match } from "./match";
import { play } from "./play/play";

export const pages = new Elysia()
  .use(home)
  .use(leaderboard)
  .use(play)
  .use(match);
