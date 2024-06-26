import { eq, like } from "drizzle-orm";
import { readDb } from "..";
import { userTbl } from "../schema";

export const getUser = (id: string) =>
  readDb.query.userTbl.findFirst({
    with: {
      picture: false,
    },
    where: eq(userTbl.id, id),
  });

export const getUserWithPicture = (id: string) =>
  readDb.query.userTbl.findFirst({
    where: eq(userTbl.id, id),
  });

export const getCurrentAdmins = () =>
  readDb.query.userTbl.findMany({
    where: like(userTbl.roles, "%admin%"),
  });
