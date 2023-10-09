import Elysia from "elysia";
import { home } from "./(home)";
import { leaderboard } from "./leaderboard";
import { match } from "./match";
import { play } from "./play/play";
import { stats } from "./stats";

export const pages = new Elysia()
  .use(home)
  .use(leaderboard)
  .use(stats)
  .use(play)
  .use(match);
