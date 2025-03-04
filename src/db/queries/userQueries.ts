import { eq, like } from "drizzle-orm";
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
