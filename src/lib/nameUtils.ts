export function shortName(name: string): string {
  const nameSplit = name.split(" ");
  const guestSuffix = "(Guest)";
  const isGuest = name.includes(guestSuffix);
  if (nameSplit.length > 1 && !isGuest) {
    return `${nameSplit[0]} ${nameSplit.at(-1)?.substring(0, 1)}. ${isGuest ? guestSuffix : ""}`;
  }
  return nameSplit[0];
}
