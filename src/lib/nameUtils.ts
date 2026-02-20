export function shortName(name: string): string {
  const nameSplit = name.split(" ");
  const guestSuffix = "(Guest)";
  const isGuest = name.includes(guestSuffix);
  if (nameSplit.length > 1 && !isGuest) {
    return `${nameSplit[0]} ${nameSplit.at(-1)?.substring(0, 1)}. ${isGuest ? guestSuffix : ""}`;
  }
  return nameSplit[0];
}

const ADJECTIVES: Record<string, string> = {
  A: "Agile", B: "Bold", C: "Clever", D: "Daring",
  E: "Eager", F: "Fierce", G: "Gentle", H: "Happy",
  I: "Intrepid", J: "Jolly", K: "Keen", L: "Lucky",
  M: "Mighty", N: "Noble", O: "Odd", P: "Proud",
  Q: "Quick", R: "Radiant", S: "Swift", T: "Tough",
  U: "Unruly", V: "Valiant", W: "Wild", X: "Xenial",
  Y: "Youthful", Z: "Zealous", Æ: "Ethereal", Ø: "Obscure", 
  Å: "Awesome",
};

const ANIMALS: Record<string, string> = {
  A: "Antelope", B: "Bear", C: "Cobra", D: "Dolphin",
  E: "Eagle", F: "Fox", G: "Gorilla", H: "Hawk",
  I: "Iguana", J: "Jaguar", K: "Koala", L: "Lion",
  M: "Moose", N: "Narwhal", O: "Oxylotl", P: "Panther",
  Q: "Quail", R: "Raccoon", S: "Shark", T: "Tiger",
  U: "Unicorn", V: "Viper", W: "Wolf", X: "Xerus",
  Y: "Yak", Z: "Zebra", Æ: "Eel", Ø: "Ocelot",
  Å: "Albatross",
};

/**
 * Generates a temporary nickname from the user's name initials.
 * First name initial maps to an adjective, last name initial maps to an animal.
 * e.g. "John Smith" -> "Jolly Shark"
 *
 * @param name - The user's full name.
 * @returns An adjective-animal nickname.
 */
export function generateTempNickname(name: string): string {
  const parts = name.trim().split(/\s+/);
  const firstInitial = (parts[0]?.[0] ?? "A").toUpperCase();
  const secondInitial = (parts.length > 1 ? parts.at(-1)![0] : parts[0]?.[1] ?? "A").toUpperCase();

  const adjective = ADJECTIVES[firstInitial] ?? "Agile";
  const animal = ANIMALS[secondInitial] ?? "Antelope";
  return `${adjective} ${animal}`;
}
