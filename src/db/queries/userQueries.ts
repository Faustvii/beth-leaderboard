import { eq } from "drizzle-orm";
import { readDb } from "..";
import { user } from "../schema";

export const getUser = (id: string) =>
  readDb.query.user.findFirst({
    with: {
      picture: false,
    },
    where: eq(user.id, id),
  });

export const getUserWithPicture = (id: string) =>
  readDb.query.user.findFirst({
    where: eq(user.id, id),
  });
