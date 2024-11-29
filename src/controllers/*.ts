import Elysia from "elysia";
import { authController } from "./auth";
import { imageGen } from "./imageGeneration";
import { webhookController } from "./webhook";

export const api = new Elysia({
  prefix: "/api",
})
  .use(authController)
  .use(webhookController)
  .use(imageGen);
