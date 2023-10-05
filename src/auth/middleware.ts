import Elysia from "elysia";
import { ctx } from "../context";

export const authed = new Elysia({
  name: "@app/plugins/authed",
})
  .use(ctx)
  .derive(async (ctx) => {
    console.log("NOOPE");
    const authRequest = ctx.readAuth.handleRequest(ctx);
    const session = await authRequest.validate();
    return { session };
  });
