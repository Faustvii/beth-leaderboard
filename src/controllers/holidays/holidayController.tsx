import cron from "@elysiajs/cron";
import Elysia from "elysia";
import { getIsItChristmas, updateIsItChristmas } from "./christmas";
import { getIsItValentine, updateIsItValentine } from "./valentine";
import { getIsItHalloween, updateIsItHalloween } from "./halloween";
import { getIsItFriday, updateIsItFriday } from "./friday";

export type Holiday =
  | "christmas"
  | "valentine"
  | "halloween"
  | "friday";

export interface HolidayState {
  christmas: boolean;
  valentine: boolean;
  halloween: boolean;
  friday: boolean;
}

// Define priority order (higher index = higher priority)
const HOLIDAY_PRIORITY: Holiday[] = [
  "friday",      // Lowest priority
  "halloween",
  "valentine",
  "christmas",   // Highest priority
];


export function updateAllHolidays() {
  updateIsItChristmas();
  updateIsItValentine();
  updateIsItHalloween();
  updateIsItFriday();
}

export const holidayCron = new Elysia().use(
  cron({
    name: "holiday checker",
    pattern: "0 0 * * * *", // every hour
    run() {
      updateAllHolidays();
    },
  }),
);

export function getCurrentHolidays(): HolidayState {
  return {
    christmas: getIsItChristmas(),
    valentine: getIsItValentine(),
    halloween: getIsItHalloween(),
    friday: getIsItFriday(),
  };
}

export function getActiveHolidays(): Holiday[] {
  const state = getCurrentHolidays();

  return Object.entries(state)
    .filter(([, value]) => value)
    .map(([key]) => key as Holiday);
}