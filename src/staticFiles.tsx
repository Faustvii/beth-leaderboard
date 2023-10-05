import { type BunFile } from "bun";
import Elysia, { type Context } from "elysia";
import { config } from "./config";
import { ctx } from "./context";

export const staticController = new Elysia({
  prefix: "/static",
})
  .use(ctx)
  .get("/styles.css", (ctx) => {
    const file = Bun.file("public/styles.css");
    return etagFileServe(file, ctx);
  })
  .get("/bar.svg", (ctx) => {
    const file = Bun.file("public/bar.svg");
    return etagFileServe(file, ctx);
  });

async function etagFileServe(file: BunFile, ctx: Context) {
  const hash = Bun.hash(await file.arrayBuffer());
  const expectedHash = ctx.headers["if-none-match"];
  if (expectedHash === hash.toString()) {
    ctx.set.status = "Not Modified";
    return;
  }
  ctx.set.headers.etag = hash.toString();
  ctx.set.headers.age = `${Date.now() - file.lastModified}`;
  if (config.env.NODE_ENV === "production")
    ctx.set.headers["Cache-Control"] = "public, max-age=86400";
  return file;
}
