export function isDateOlderThanNDays(date: Date, daysAgo: number): boolean {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - daysAgo);
  return date.getTime() < currentDate.getTime();
}

export function subtractDays(date: Date, days: number): Date {
  const daysMs = days * (24 * 60 * 60 * 1000);
  const dateCopy = new Date(date);
  dateCopy.setTime(dateCopy.getTime() - daysMs);
  return dateCopy;
}

export function getDatePartFromDate(date: Date) {
  return date.toISOString().split("T")[0];
}
