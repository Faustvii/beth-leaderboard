import Elysia from "elysia";
import { home } from "./(home)";
import { leaderboard } from "./leaderboard";
import { play } from "./play/play";

export const pages = new Elysia().use(home).use(leaderboard).use(play);
