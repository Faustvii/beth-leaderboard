import Elysia from "elysia";
import { authController } from "./auth";
import { imageGen } from "./imageGeneration";

export const api = new Elysia({
  prefix: "/api",
})
  .use(authController)
  .use(imageGen);
