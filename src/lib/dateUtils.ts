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
