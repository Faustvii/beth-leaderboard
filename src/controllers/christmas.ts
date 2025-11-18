import cron from "@elysiajs/cron";
import Elysia from "elysia";

export const Christmas = new Elysia().use(
  cron({
    name: "is it christmas?",
    pattern: "0 0 * * * *", // every hour
    run() {
      updateIsItChristmas();
    },
  }),
);

export function getIsItChristmas() {
  return process.env.IS_CHRISTMAS === "true";
}

export function updateIsItChristmas() {
  // getMonth is zero indexed
  if (new Date().getMonth() === 11) {
    process.env.IS_CHRISTMAS = "true";
  } else {
    process.env.IS_CHRISTMAS = "false";
  }
}
