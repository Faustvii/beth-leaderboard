import { and, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { ctx } from "../context";
import { readDb } from "../db";
import { webhookTbl, type WebhookEventType } from "../db/schema/webhooks";
import { type Match } from "../lib/ratings/rating";

export const webhookController = new Elysia({ prefix: "/webhook" })
  .use(ctx)
  .post(
    "/",
    async ({ writeDb, body }) => {
      await writeDb.insert(webhookTbl).values(body);
      return { success: true, message: "Webhook registered successfully" };
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
  eventType: WebhookEventType,
  dataToSend: unknown,
) => {
  const webhooks = await readDb
    .select({ secret: webhookTbl.secret, url: webhookTbl.url })
    .from(webhookTbl)
    .where(
      and(eq(webhookTbl.eventType, eventType), eq(webhookTbl.active, true)),
    )
    .all();

  if (webhooks.length === 0) {
    console.log(`No active webhooks registered for event type: ${eventType}`);
    return;
  }
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: dataToSend,
  };

  const webhookPromises = webhooks.map(async (webhook) => {
    try {
      console.log(`Sending ${eventType} webhook to ${webhook.url}`);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": eventType,
          ...(webhook.secret && { "X-Webhook-Secret": webhook.secret }),
        },
        body: JSON.stringify({
          ...payload,
          // Keep secret in body for backward compatibility if needed
          secret: webhook.secret || undefined,
        }),
      });

      if (!response.ok) {
        console.error(
          `Webhook failed for ${webhook.url}: ${response.status} ${response.statusText}`,
        );
      } else {
        console.log(`Webhook sent successfully to ${webhook.url}`);
      }
    } catch (error) {
      console.error(`Error sending webhook to ${webhook.url}:`, error);
    }
  });

  await Promise.allSettled(webhookPromises);
};
