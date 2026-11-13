import { asc, desc, eq, inArray, like } from "drizzle-orm";
import { readDb } from "..";
import { shortName } from "../../lib/nameUtils";
import { matches, userTbl } from "../schema";
import { type User } from "../schema/auth";

export const getUser = async (
  id: string,
  isAuthenticated: boolean,
): Promise<User | undefined> => {
  const player = await readDb.query.userTbl.findFirst({
    columns: { picture: false },
    where: eq(userTbl.id, id),
  });
  if (player) {
    if (!isAuthenticated) {
      player.name = player.nickname;
    } else {
      player.name = `${player.nickname} (${shortName(player.name)})`;
    }
  }
  return player;
};

export const getUserPicture = async (id: string) => {
  const dbUser = await readDb.query.userTbl.findFirst({
    columns: { picture: true },
    where: eq(userTbl.id, id),
  });
  return dbUser?.picture;
};

export const getCurrentAdmins = async (
  isAuthenticated: boolean,
): Promise<User[]> => {
  const players = await readDb.query.userTbl.findMany({
    columns: { picture: false },
    where: like(userTbl.roles, "%admin%"),
  });

  return players.map((player) => {
    if (!isAuthenticated) {
      player.name = player.nickname;
    } else {
      player.name = `${player.nickname} (${shortName(player.name)})`;
    }
    return player;
  });
};

/**
 * List users by name, sorted by the similarity of the name to the search term.
 *
 * Names in which the search string appears earlier are prioritized, as matches towards the
 * beginning of the name (e.g., in the first name) are generally more relevant.
 */
export const listUsersByName = async (
  searchString: string,
  count = 5,
): Promise<User[]> => {
  searchString = searchString.toLowerCase();
  const players: User[] = await readDb.query.userTbl.findMany({
    columns: { picture: false },
    where: like(userTbl.name, `%${searchString}%`),
  });

  const bestMatches = players
    .map((player): [User, number] => {
      return [player, player.name.toLowerCase().indexOf(searchString)];
    })
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map((a) => a[0]);

  return bestMatches;
};

export const listAllUsers = async (): Promise<User[]> => {
  return readDb.query.userTbl.findMany({
    columns: { picture: false },
    orderBy: asc(userTbl.name),
  });
};

// Players from the most recent matches, most recent first
export const listRecentlyActiveUsers = async (count = 8): Promise<User[]> => {
  const recent = await readDb.query.matches.findMany({
    columns: {
      whitePlayerOne: true,
      whitePlayerTwo: true,
      blackPlayerOne: true,
      blackPlayerTwo: true,
    },
    orderBy: desc(matches.createdAt),
    limit: count * 3,
  });
  const ids: string[] = [];
  for (const m of recent) {
    for (const id of [
      m.whitePlayerOne,
      m.whitePlayerTwo,
      m.blackPlayerOne,
      m.blackPlayerTwo,
    ]) {
      if (id && !ids.includes(id)) ids.push(id);
    }
    if (ids.length >= count) break;
  }
  const wanted = ids.slice(0, count);
  if (wanted.length === 0) return [];
  const players = await readDb.query.userTbl.findMany({
    columns: { picture: false },
    where: inArray(userTbl.id, wanted),
  });
  return wanted
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is User => p !== undefined);
};
