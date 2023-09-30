import Elysia from "elysia";
import { home } from "./(home)";
import { leaderboard } from "./leaderboard";

export const pages = new Elysia().use(home).use(leaderboard);
