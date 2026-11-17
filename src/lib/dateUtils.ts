export const minuteInMs = 60 * 1000;
export const hourInMs = 60 * minuteInMs;
export const dayInMs = 24 * hourInMs;

export function isDateOlderThanNDays(date: Date, daysAgo: number): boolean {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - daysAgo);
  return date.getTime() < currentDate.getTime();
}

export function subtractDays(date: Date, days: number): Date {
  const daysMs = days * dayInMs;
  const dateCopy = new Date(date);
  dateCopy.setTime(dateCopy.getTime() - daysMs);
  return dateCopy;
}

export function getDatePartFromDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / dayInMs);
}

export function fromTimezoneToUTC(date: Date, timezone = "Europe/Copenhagen") {
  const wallClockAsUtc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );
  // The offset depends on the instant (DST), so refine once with the first guess.
  const guess = wallClockAsUtc - getOffsetMs(wallClockAsUtc, timezone);
  return new Date(wallClockAsUtc - getOffsetMs(guess, timezone));
}

/** How far `timezone` is ahead of UTC at the given instant, in milliseconds. */
function getOffsetMs(instant: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(instant));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  // formatToParts drops milliseconds, so compare against the instant without them.
  return asUtc - Math.floor(instant / 1000) * 1000;
}
