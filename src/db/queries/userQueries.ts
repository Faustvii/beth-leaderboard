import { eq, ilike, like } from "drizzle-orm";
import { readDb } from "..";
import { shortName } from "../../lib/nameUtils";
import { userTbl } from "../schema";

export const getUser = async (id: string, isAuthenticated: boolean) => {
  const player = await readDb.query.userTbl.findFirst({
    with: {
      picture: false,
    },
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

export const getUserWithPicture = (id: string) =>
  readDb.query.userTbl.findFirst({
    where: eq(userTbl.id, id),
  });

export const getCurrentAdmins = async (isAuthenticated: boolean) => {
  const players = await readDb.query.userTbl.findMany({
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
export const listUsersByName = async (searchString: string, count = 5) => {
  searchString = searchString.toLowerCase();
  const players = await readDb
    .select({ name: userTbl.name, id: userTbl.id })
    .from(userTbl)
    .where(ilike(userTbl.name, `%${searchString}%`));

  const bestMatches = players
    .map((player): [{ name: string; id: string }, number] => {
      return [player, player.name.toLowerCase().indexOf(searchString)];
    })
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map((a) => a[0]);

  return bestMatches;
};
