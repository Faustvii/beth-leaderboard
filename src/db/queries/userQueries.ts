import { eq } from "drizzle-orm";
import { readDb } from "..";
import { user } from "../schema";

export const getUser = (id: string) =>
  readDb.query.user.findFirst({
    where: eq(user.id, id),
  });

export const getUserNoPicture = (id: string) =>
  readDb.query.user.findFirst({
    where: eq(user.id, id),
    with: {
      picture: false,
    },
  });
