import { cron } from "@elysiajs/cron";
import { HoltLogger } from "@tlscipher/holt";
import { Elysia } from "elysia";
import { auth } from "../auth";
import { config } from "../config";
import { client, db } from "../db";
import { redirect } from "../lib";
import { htmlRender } from "../lib/render";

export const ctx = new Elysia({
  name: "@app/ctx",
})
  // @ts-expect-error ts can't figure out types
  .use(new HoltLogger().getLogger())
  .decorate("db", db)
  .decorate("config", config)
  .decorate("auth", auth)
  .decorate("redirect", redirect)
  .use(htmlRender())
  .use(
    // @ts-expect-error ts can't figure out types
    config.env.DATABASE_CONNECTION_TYPE === "local-replica"
      ? cron({
          name: "heartbeat",
          pattern: "*/2 * * * * *",
          run() {
            // const now = performance.now();
            // console.log("Syncing database...");
            void client.sync().then(() => {
              // console.log(`Database synced in ${performance.now() - now}ms`);
            });
          },
        })
      : (a) => a,
  )
  .derive(async (ctx) => {
    const now = performance.now();
    const authRequest = ctx.auth.handleRequest(ctx);
    const session = await authRequest.validate();
    console.log(`Authed in ${performance.now() - now}ms`);
    return { session };
  });
