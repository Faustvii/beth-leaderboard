export function isDateOlderThanNDays(date: Date, daysAgo: number): boolean {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - daysAgo);
  return date.getTime() < currentDate.getTime();
}

export function getDatePartFromDate(date: Date) {
  return date.toISOString().split("T")[0];
}
