import { libsql } from "@lucia-auth/adapter-sqlite";
import { azureAD, google } from "@lucia-auth/oauth/providers";
import { lucia } from "lucia";
import { elysia } from "lucia/middleware";
import { config } from "../config";
import { readClient, writeClient } from "../db";

const envAliasMap = {
  production: "PROD",
  development: "DEV",
} as const;

const envAlias = envAliasMap[config.env.NODE_ENV];

export interface ElysiaContext {
  request: Request;
  set: {
    headers: Record<string, string> & {
      ["Set-Cookie"]?: string | string[];
    };
    status?: number | undefined | string;
    redirect?: string | undefined;
  };
}

export const readAuth = lucia({
  env: envAlias,
  middleware: elysia(),
  adapter: libsql(readClient, {
    user: "user",
    key: "user_key",
    session: "user_session",
  }),
  getUserAttributes: (data) => {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
    };
  },
});

export const writeAuth = lucia({
  env: envAlias,
  middleware: elysia(),
  adapter: libsql(writeClient, {
    user: "user",
    key: "user_key",
    session: "user_session",
  }),
  getUserAttributes: (data) => {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
    };
  },
});

export type ReadAuth = typeof readAuth;
export type WriteAuth = typeof writeAuth;

export const googleAuth = google(writeAuth, {
  clientId: config.env.GOOGLE_CLIENT_ID,
  clientSecret: config.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${config.env.HOST_URL}/api/auth/google/callback`,
  scope: ["profile", "email"],
});

export const azureAuth = azureAD(writeAuth, {
  clientId: config.env.AZURE_CLIENT_ID,
  clientSecret: config.env.AZURE_CLIENT_SECRET,
  redirectUri: `${config.env.HOST_URL}/api/auth/azure/callback`,
  tenant: config.env.AZURE_TENANT,
  scope: ["openid email profile User.Read"],
});
