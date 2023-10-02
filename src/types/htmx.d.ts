import { type App } from "../main";

/* eslint-disable @typescript-eslint/no-unused-vars */
type RoutesByType<
  Schema extends Record<string, never>, // Ensure keys are strings
  Type extends "get" | "post" | "put" | "delete" | "patch",
> = RouterPattern<
  RemoveTrailingSlash<
    string &
      keyof {
        // Constrain to strings here
        [key in keyof Schema as Schema[key] extends { [key in Type]: unknown }
          ? key
          : never]: true;
      }
  >
>;

type RemoveTrailingSlash<S extends string> = S extends `${infer T}/`
  ? T extends ""
    ? S
    : T
  : S;

type RouterPattern<T extends string> =
  T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? `${Start}${string}/${RouterPattern<Rest>}`
    : T extends `${infer Start}:${infer Param}`
    ? `${Start}${string}`
    : T extends `${infer Start}*`
    ? `${Start}${string}`
    : T;

type StartsWithApi<T extends string> = T extends `${"/api"}${infer Rest}`
  ? T
  : never;

type DoesntStartWithApi<T extends string> = T extends `${"/api"}${infer Rest}`
  ? never
  : T;

type Schema = App["schema"];

type PostRoutes = RoutesByType<Schema, "post">;
type GetRoutes = RoutesByType<Schema, "get">;
type PutRoutes = RoutesByType<Schema, "put">;
type DeleteRoutes = RoutesByType<Schema, "delete">;
type PatchRoutes = RoutesByType<Schema, "patch">;

declare namespace JSX {
  interface HtmlTag extends Htmx.Attributes {
    ["hx-get"]?: GetRoutes;
    ["hx-post"]?: PostRoutes;
    ["hx-put"]?: PutRoutes;
    ["hx-delete"]?: DeleteRoutes;
    ["hx-patch"]?: PatchRoutes;
    _?: string;
  }
}
