import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const env = createEnv({
  server: {
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
    DATABASE_CONNECTION_TYPE: z.enum(["local", "remote", "local-replica"]),
    DATABASE_URL: z
      .string()
      .optional()
      .refine((s) => {
        // not needed for local only
        const type = process.env.DATABASE_CONNECTION_TYPE;
        return type === "remote" || type === "local-replica"
          ? s && s.length > 0
          : true;
      }),
    DATABASE_AUTH_TOKEN: z
      .string()
      .optional()
      .refine((s) => {
        // not needed for local only
        const type = process.env.DATABASE_CONNECTION_TYPE;
        return type === "remote" || type === "local-replica"
          ? s && s.length > 0
          : true;
      }),
    DATABASE_SYNC_INTERVAL: z.number().positive().optional().default(30),
    NODE_ENV: z.enum(["development", "production", "preprod"]),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    AZURE_CLIENT_ID: z.string(),
    AZURE_CLIENT_SECRET: z.string(),
    AZURE_TENANT: z.string(),
    HOST_URL: z.string(),
    GIT_SHA: z.string(),
    // Enables the fake-user "login for testing" flow outside of development,
    // e.g. in PR preview environments that run with NODE_ENV=production.
    ALLOW_LOCAL_LOGIN: z.enum(["true", "false"]).default("false"),
  },
  runtimeEnv: process.env,
});

const args = {
  // watch: process.argv.includes("--watch"),
  // liveReload: true,
};

export const config = {
  env,
  args,
  /**
   * Whether the fake-user local signin flow may be used. Development and staging (preprod)
   * environments always allow it, production only allows it when ALLOW_LOCAL_LOGIN="true" (used by
   * PR preview environments so that login can be exercised there).
   */
  get allowLocalLogin(): boolean {
    return env.NODE_ENV !== "production" || env.ALLOW_LOCAL_LOGIN === "true";
  },
};
