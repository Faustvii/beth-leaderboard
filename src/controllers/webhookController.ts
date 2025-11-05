import { eq, and } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { ctx } from "../context";
import { readDb } from "../db";
import { webhookTbl, type WebhookEventType } from "../db/schema/webhooks";
import type { Match } from "../lib/ratings/rating";
import { fancyInBetweenText } from "../pages/stats";

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
  )
  .get("/", async ({ writeDb }) => {
    const webhooks = await writeDb.select().from(webhookTbl).all();
    return { webhooks };
  })
  .delete(
    "/:id",
    async ({ writeDb, params }) => {
      await writeDb
        .update(webhookTbl)
        .set({ active: false })
        .where(eq(webhookTbl.id, Number(params.id)));
      return { success: true, message: "Webhook deactivated" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: unknown;
}

function createMatchWebhookPayload(match: Match): WebhookPayload {
  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      (name): name is string => name !== null && name !== undefined,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      (name): name is string => name !== null && name !== undefined,
    ),
  };

  let winners: string[];
  let losers: string[];

  switch (match.result) {
    case "Draw":
      winners = [];
      losers = [];
      break;
    case "White":
      winners = teamPlayers.white;
      losers = teamPlayers.black;
      break;
    case "Black":
      winners = teamPlayers.black;
      losers = teamPlayers.white;
      break;
  }

  return {
    event: "match",
    timestamp: new Date().toISOString(),
    data: {
      matchId: match.id,
      createdAt: match.createdAt.toISOString(),
      result: match.result,
      scoreDiff: match.scoreDiff,
      seasonId: match.seasonId,
      teams: {
        black: {
          players: teamPlayers.black,
          playerIds: [
            match.blackPlayerOne.id,
            match.blackPlayerTwo?.id,
          ].filter(Boolean),
        },
        white: {
          players: teamPlayers.white,
          playerIds: [
            match.whitePlayerOne.id,
            match.whitePlayerTwo?.id,
          ].filter(Boolean),
        },
      },
      winners,
      losers,
      // Human-readable summary
      summary:
        match.result === "Draw"
          ? `${teamPlayers.white.join(" & ")} drew with ${teamPlayers.black.join(" & ")}`
          : `${winners.join(" & ")} ${fancyInBetweenText(match.scoreDiff, losers.join(" & "))}`,
    },
  };
}


export const execute_webhooks = async (
  eventType: WebhookEventType,
  dataToSend: unknown,
) => {
  const webhooks = await readDb
    .select()
    .from(webhookTbl)
    .where(and(
        eq(webhookTbl.eventType, eventType),
        eq(webhookTbl.active, true)
      ))
    .all();

  if (webhooks.length === 0) {
    console.log(`No active webhooks registered for event type: ${eventType}`);
    return;
  }

  // Format the payload based on event type
  let payload: WebhookPayload;
  
  if (eventType === "match" && isMatch(dataToSend)) {
    payload = createMatchWebhookPayload(dataToSend);
  } else {
    // For other event types, send generic payload
    payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: dataToSend,
    };
  }

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

// Type guard to check if data is a Match object
function isMatch(data: unknown): data is Match {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "result" in data &&
    "blackPlayerOne" in data &&
    "whitePlayerOne" in data
  );
}