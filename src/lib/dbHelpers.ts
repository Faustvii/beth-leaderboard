import { config } from "../config";
import { readClient } from "../db";

export async function syncIfLocal() {
  if (config.env.DATABASE_CONNECTION_TYPE === "local-replica") {
    await readClient.sync();
  }
}
