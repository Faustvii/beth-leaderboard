import type Elysia from "elysia";

export function htmlRender() {
  async function html<T extends (() => JSX.Element) | JSX.Element>(
    lazyHtml: T,
  ): Promise<Response> {
    return renderToStringResponse(lazyHtml);
  }

  return function htmlPlugin(app: Elysia) {
    return app.decorate("html", html);
  };
}

export function renderToString<T extends (() => JSX.Element) | JSX.Element>(
  lazyHtml: T,
): T extends () => infer R ? R : T {
  const resultPromise = typeof lazyHtml === "function" ? lazyHtml() : lazyHtml;
  return resultPromise as T extends () => infer R ? R : T;
}

export async function renderToStringResponse<
  T extends (() => JSX.Element) | JSX.Element,
>(lazyHtml: T): Promise<Response> {
  const result = await renderToString(lazyHtml);
  return new Response(result, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
