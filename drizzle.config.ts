import { type Config } from "drizzle-kit";
import { config } from "./src/config";

const dbCredentials = {
  url: config.env.DATABASE_URL || "",
  authToken: config.env.DATABASE_AUTH_TOKEN!,
};

export default {
  schema: "./src/db/schema/index.ts",
  dialect: "sqlite",
  driver: "turso",
  out: "./drizzle",
  dbCredentials,
  verbose: true,
  strict: true,
  tablesFilter: ["!libsql_wasm_func_table"],
} satisfies Config;
