import Elysia from "elysia";
import { playSocket } from "./playSocket";

export const webSockets = new Elysia().use(playSocket);
