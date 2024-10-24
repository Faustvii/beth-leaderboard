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

export function fromTimezoneToUTC(date: Date, timezone: string = "Europe/Copenhagen") {
  const offset = getOffsetMinutes(date, timezone);
  const dateCopy = new Date(date);
  dateCopy.setMinutes(dateCopy.getMinutes() - offset);
  return dateCopy;
}

function getOffsetMinutes(date: Date, timezone: string) {
  if (timezone !== "Europe/Copenhagen") throw new Error("Only Europe/Copenhagen is supported for input timezone");
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (localTimezone !== "UTC") throw new Error("Only UTC is supported for local timezone");

  const lastSundayInMatch = lastSundayOfMonth(date.getFullYear(), 2);
  const lastSundayInOktober = lastSundayOfMonth(date.getFullYear(), 9);
  const isSummertime = date >= lastSundayInMatch && date < lastSundayInOktober;

  return isSummertime ? 120 : 60;
}

function lastSundayOfMonth(year: number, monthIndex: number): Date {
  const firstOfNextMonth = new Date(year, monthIndex+1, 1);
  const weekday = firstOfNextMonth.getDay();
  const dayDiff = weekday===0 ? 7 : weekday;
  const lastSunday = firstOfNextMonth.setDate(firstOfNextMonth.getDate() - dayDiff);

  return new Date(lastSunday);
}
