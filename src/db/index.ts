import { createClient, type Config } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../config";
import * as schema from "./schema";

const { DATABASE_CONNECTION_TYPE } = config.env;

const options = {
  local: { url: "file:local.sqlite" },
  remote: {
    url: config.env.DATABASE_URL,
    authToken: config.env.DATABASE_AUTH_TOKEN!,
  },
  "local-replica": {
    url: "file:local.sqlite",
    syncUrl: config.env.DATABASE_URL,
    authToken: config.env.DATABASE_AUTH_TOKEN!,
  },
} satisfies Record<typeof DATABASE_CONNECTION_TYPE, Config>;

export const readClient = createClient(options[DATABASE_CONNECTION_TYPE]);

if (config.env.DATABASE_CONNECTION_TYPE === "local-replica") {
  await readClient.sync();
}

const remoteOptions = {
  url: config.env.DATABASE_URL,
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
