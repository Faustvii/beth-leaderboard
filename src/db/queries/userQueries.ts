import { eq, inArray, like } from "drizzle-orm";
import { readDb } from "..";
import { shortName } from "../../lib/nameUtils";
import { userTbl } from "../schema";

// Infer user type for the helper function
type UserForNameFormatting = Pick<
  typeof userTbl.$inferSelect,
  "name" | "nickname"
>;

// Helper function uses inferred type
function _formatUserName(
  user: UserForNameFormatting,
  isAuthenticated: boolean,
): string {
  return isAuthenticated
    ? `${user.nickname ?? user.name} (${shortName(user.name)})`
    : user.nickname ?? user.name;
}

export const getUser = async (id: string, isAuthenticated: boolean) => {
  const player = await readDb.query.userTbl.findFirst({
    with: {
      picture: false,
    },
    where: eq(userTbl.id, id),
  });
  if (player) {
    player.name = _formatUserName(player, isAuthenticated);
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
    with: {
      picture: false,
    },
  });

  return players.map((player) => {
    const formattedName = _formatUserName(player, isAuthenticated);
    return { ...player, name: formattedName };
  });
};

export async function getUsersByIds(ids: string[], isAuthenticated: boolean) {
  if (ids.length === 0) {
    return [];
  }
  const users = await readDb.query.userTbl.findMany({
    where: inArray(userTbl.id, ids),
    columns: {
      id: true,
      name: true,
      nickname: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: _formatUserName(user, isAuthenticated),
  }));
}
