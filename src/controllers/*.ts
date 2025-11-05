import Elysia from "elysia";
import { authController } from "./auth";
import { imageGen } from "./imageGeneration";
import { questJobs } from "./questJobs";
import { webhookController } from "./webhookController";

export const api = new Elysia({
  prefix: "/api",
})
  .use(authController)
  .use(webhookController)
  .use(questJobs)
  .use(imageGen);
