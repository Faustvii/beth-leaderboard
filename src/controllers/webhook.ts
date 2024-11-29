import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { ctx } from "../context";
import { readDb } from "../db";
import { webhookTbl, type WebookEventType } from "../db/schema/webhooks";

export const webhookController = new Elysia({ prefix: "/webhook" })
  .use(ctx)
  .post(
    "/",
    async ({ writeDb, body }) => {
      await writeDb.insert(webhookTbl).values(body);
    },
    {
      body: t.Object({
        url: t.String(),
        secret: t.String(),
        eventType: t.Enum({
          match: "match",
          season_end: "season_end",
          season_start: "season_start",
        }),
      }),
    },
  );

export const execute_webhooks = async (
  eventType: WebookEventType,
  dataToSend: unknown,
) => {
  const webhooks = await readDb
    .select({ secret: webhookTbl.secret, url: webhookTbl.url })
    .from(webhookTbl)
    .where(eq(webhookTbl.eventType, eventType))
    .all();

  webhooks.forEach((webhook) => {
    fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: webhook.secret || "No secret",
        data: dataToSend,
      }),
    }).catch((error) => console.error(error));
  });
};
