import { mkdir } from "node:fs/promises";
import { createClient, type Config } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { config } from "../config";
import * as schema from "./schema";

const { DATABASE_CONNECTION_TYPE } = config.env;

if (config.env.DATABASE_CONNECTION_TYPE === "local") {
  const bunFile = Bun.file("data/local.sqlite");
  if ((await bunFile.exists()) === false) {
    await mkdir("data/", { recursive: true });
  }
}

const options = {
  local: { url: "file:data/local.sqlite" },
  remote: {
    url: config.env.DATABASE_URL || "",
    authToken: config.env.DATABASE_AUTH_TOKEN!,
  },
  "local-replica": {
    url: "file:data/local.sqlite",
    syncUrl: config.env.DATABASE_URL,
    authToken: config.env.DATABASE_AUTH_TOKEN!,
    syncInterval: config.env.DATABASE_SYNC_INTERVAL
  },
} satisfies Record<typeof DATABASE_CONNECTION_TYPE, Config>;

export const readClient = createClient(options[DATABASE_CONNECTION_TYPE]);

const remoteOptions = {
  url: config.env.DATABASE_URL || "",
  authToken: config.env.DATABASE_AUTH_TOKEN!,
};
let remoteDbClient = readClient;

if (DATABASE_CONNECTION_TYPE !== "local") {
  remoteDbClient = createClient(remoteOptions);
}

export const writeClient = remoteDbClient;
export const writeDb = drizzle(remoteDbClient, {
  schema,
  logger: false,
});
export const readDb = drizzle(readClient, {
  schema,
  logger: false,
});

export type CrokDbQueryable = Pick<LibSQLDatabase<typeof schema>, "query">;
