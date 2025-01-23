import Elysia from "elysia";
import { home } from "./(home)";
import { Admin } from "./admin/Admin";
import { Help } from "./Help";
import { leaderboard } from "./leaderboard";
import { match } from "./log-match/logMatch";
import { login } from "./login";
import { News } from "./News";
import { play } from "./play/play";
import { profile } from "./profile";
import { matchResult } from "./result";
import { stats } from "./stats";

const publicPages = new Elysia()
  .use(home)
  .use(login)
  .use(leaderboard)
  .use(stats)
  .use(profile)
  .use(Help)
  .use(News)
  .use(matchResult);

const authPages = new Elysia().use(play).use(match).use(Admin);

export const pages = new Elysia().use(publicPages).use(authPages);
