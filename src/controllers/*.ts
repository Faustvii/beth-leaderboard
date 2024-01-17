import Elysia from "elysia";
import { authController } from "./auth";
import { cronJobs } from "./cronJobs";

export const api = new Elysia({
  prefix: "/api",
})
  .use(authController)
  .use(cronJobs);
