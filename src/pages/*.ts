import Elysia from "elysia";
import { home } from "./(home)";
import { leaderboard } from "./leaderboard";
import { login } from "./login";
import { match } from "./match";
import { play } from "./play/play";
import { profile } from "./profile";
import { stats } from "./stats";

const publicPages = new Elysia()
  .use(home)
  .use(login)
  .use(leaderboard)
  .use(stats)
  .use(profile);

const authPages = new Elysia().use(play).use(match);

export const pages = new Elysia().use(publicPages).use(authPages);
