import { cron } from "@elysiajs/cron";
import { HoltLogger } from "@tlscipher/holt";
import { Elysia } from "elysia";
import { readAuth, writeAuth } from "../auth";
import { config } from "../config";
import { readClient, readDb, writeDb } from "../db";
import { getActiveSeason, getSeason } from "../db/queries/seasonQueries";
import {
  allTimeSeason,
  RatingSystemType,
  ratingSystemTypes,
} from "../db/schema/season";
import { redirect } from "../lib";
import { getRatingSystem } from "../lib/ratings/rating";
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
  })
  .derive(async ({ query }) => {
    // Get season with the following priority:
    // 1. Season specified in query
    // 2. Season active in the database
    // 3. "All time" season
    let season = allTimeSeason;
    if (!!query.season) {
      const selectedSeason = await getSeason(parseInt(query.season, 10));
      if (selectedSeason) {
        season = selectedSeason;
      }
    } else {
      const activeSeason = await getActiveSeason();
      if (activeSeason) {
        season = activeSeason;
      }
    }

    // Get rating system type with the following priority:
    // 1. Rating system specified in query
    // 2. Rating system of the season previously found
    let ratingSystemType: RatingSystemType = season.ratingSystem;
    if (
      !!query.ratingSystem &&
      ratingSystemTypes.includes(query.ratingSystem as RatingSystemType)
    ) {
      ratingSystemType = query.ratingSystem as RatingSystemType;
    }

    const ratingSystem = getRatingSystem(ratingSystemType);

    return {
      season,
      ratingSystem,
    };
  });
