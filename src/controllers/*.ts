import Elysia from "elysia";
import { authController } from "./auth";
import { imageGen } from "./imageGeneration";
import { scores } from "./scores";

export const api = new Elysia({
  prefix: "/api",
})
  .use(authController)
  .use(imageGen)
  .use(scores); // TODO: Remove scores from here
