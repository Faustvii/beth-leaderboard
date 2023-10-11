import Elysia from "elysia";
import { home } from "./(home)";
import { leaderboard } from "./leaderboard";
import { login } from "./login";
import { match } from "./match";
import { play } from "./play/play";
import { stats } from "./stats";

export const pages = new Elysia()
  .use(home)
  .use(login)
  .use(leaderboard)
  .use(stats)
  .use(play)
  .use(match);
