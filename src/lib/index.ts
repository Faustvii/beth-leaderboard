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
  if (headers["hx-request"]) {
    return headers["hx-request"] === "true";
  }

  // When using hyperscript like we do in SelectGet the hx-* headers are not included,
  // so we fall back to a reserved header.
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Dest#empty
  // HTMX uses XMLHttpRequest
  return headers["sec-fetch-dest"] === "empty";
}

export function notEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  if (value === null || value === undefined) return false;
  return true;
}

export function unique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}

export async function measure<T>(
  fn: () => Promise<T> | T,
): Promise<{ result: T; elaspedTimeMs: number }> {
  const now = performance.now();
  const result = await Promise.resolve(fn());
  return { result, elaspedTimeMs: performance.now() - now };
}
