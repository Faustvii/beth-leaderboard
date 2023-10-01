import { type HTTPStatusName } from "elysia/utils";
import { config } from "../config";
import { client } from "../db";

export async function syncIfLocal() {
  if (config.env.DATABASE_CONNECTION_TYPE === "local-replica") {
    await client.sync();
  }
}

export function redirect(
  {
    set,
    headers,
  }: {
    headers: Record<string, string | null>;
    set: {
      headers: Record<string, string> & {
        "Set-Cookie"?: string | string[];
      };
      status?: number | HTTPStatusName;
      redirect?: string;
    };
  },
  url: string,
) {
  if (headers["hx-request"] === "true") {
    set.headers["HX-Redirect"] = url;
  } else {
    set.redirect = url;
  }
}
