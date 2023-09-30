import Elysia from "elysia";
import { home } from "./(home)";

export const pages = new Elysia().use(home);
