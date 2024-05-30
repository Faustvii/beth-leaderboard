import { cron } from "@elysiajs/cron";
import { HoltLogger } from "@tlscipher/holt";
import { Elysia } from "elysia";
import { readAuth, writeAuth } from "../auth";
import { config } from "../config";
import { readClient, readDb, writeDb } from "../db";
import { redirect } from "../lib";
import { htmlRender } from "../lib/render";

export const ctx = new Elysia({
  name: "@app/ctx",
})
  // @ts-expect-error ts can't figure out types
  .use(new HoltLogger().getLogger())
  .decorate("readDb", readDb)
  .decorate("writeDb", writeDb)
  .decorate("config", config)
  .decorate("readAuth", readAuth)
  .decorate("writeAuth", writeAuth)
  .decorate("redirect", redirect)
  // .use(html())
  .use(htmlRender())
  .use(
    // @ts-expect-error ts can't figure out types
    config.env.DATABASE_CONNECTION_TYPE === "local-replica"
      ? cron({
          name: "heartbeat",
          pattern: "*/2 * * * * *",
          run() {
            readClient
              .sync()
              .then()
              .catch((err) => {
                console.log("Error syncing database", err);
              });
          },
        })
      : (a) => a,
  )
  .derive(async (ctx) => {
    const authRequest = ctx.readAuth.handleRequest(ctx);
    const session = await authRequest.validate();
    const userRoles = session?.user.roles?.split(",") ?? [];
    return { session, userRoles };
  });
