export function shortName(name: string): string {
  const nameSplit = name.split(" ");
  const guestSuffix = "(Guest)";
  const isGuest = name.includes(guestSuffix);
  if (nameSplit.length > 1) {
    const lastName = isGuest ? -2 : -1;
    return `${nameSplit[0]} ${nameSplit.at(lastName)?.substring(0, 1)}. ${isGuest ? guestSuffix : ""}`;
  }

  return nameSplit[0];
}
