import { type HTTPStatusName } from "elysia/utils";

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

export function isHxRequest(headers: Record<string, string | null>) {
  return headers["hx-request"] === "true";
}

export function notEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  if (value === null || value === undefined) return false;
  return true;
}

export async function measure<T>(
  fn: () => Promise<T> | T,
): Promise<{ result: T; elaspedTimeMs: number }> {
  const now = performance.now();
  const result = await Promise.resolve(fn());
  return { result, elaspedTimeMs: performance.now() - now };
}

export function getUnixDateFromDate(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}
