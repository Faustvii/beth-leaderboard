import { type BunFile } from "bun";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { type HTTPStatusName } from "elysia/utils";
import { config } from "./config";
import { ctx } from "./context";
import { user } from "./db/schema";
import { resizeImage } from "./lib/userImages";

export const staticController = new Elysia({
  prefix: "/static",
})
  .use(ctx)
  .get("/styles.css", (ctx) => {
    const file = Bun.file("public/styles.css");
    return etagFileServe(file, ctx.set, ctx.headers);
  })
  .get("/bar.svg", (ctx) => {
    const file = Bun.file("public/bar.min.svg");
    return etagFileServe(file, ctx.set, ctx.headers);
  })
  .get("/crokinole.svg", (ctx) => {
    const file = Bun.file("public/crokinole-c.min.svg");
    return etagFileServe(file, ctx.set, ctx.headers);
  })
  .get("/user/:id", async (ctx) => {
    const fileName = `public/user/${ctx.params.id}.webp`;
    let file = Bun.file(fileName);
    const exists = await file.exists();
    if (!exists) {
      const dbUser = await ctx.readDb.query.user.findFirst({
        where: eq(user.id, ctx.params.id),
      });
      if (!dbUser) {
        return new Response(null, { status: 404 });
      }
      const picture = dbUser.picture;
      const pictureBuffer = Buffer.from(picture, "base64");
      await Bun.write(fileName, pictureBuffer);
      file = Bun.file(fileName);
    }
    return etagFileServe(file, ctx.set, ctx.headers);
  })
  .get("/user/:id/small", async (ctx) => {
    const fileName = `public/user/${ctx.params.id}-32x32.webp`;
    let file = Bun.file(fileName);
    const exists = await file.exists();
    if (!exists) {
      const dbUser = await ctx.readDb.query.user.findFirst({
        where: eq(user.id, ctx.params.id),
      });
      if (!dbUser) {
        return new Response(null, { status: 404 });
      }
      const picture = await resizeImage(dbUser.picture, {
        width: 32,
        height: 32,
      });
      const pictureBuffer = Buffer.from(picture, "base64");
      await Bun.write(fileName, pictureBuffer);
      file = Bun.file(fileName);
    }
    return etagFileServe(file, ctx.set, ctx.headers);
  });

async function etagFileServe(
  file: BunFile,
  set: {
    headers: Record<string, string> & {
      "Set-Cookie"?: string | string[];
    };
    status?: number | HTTPStatusName;
    redirect?: string;
  },
  headers: Record<string, string | null>,
) {
  const hash = Bun.hash(await file.arrayBuffer());
  const expectedHash = headers["if-none-match"];
  if (expectedHash === hash.toString()) {
    set.status = "Not Modified";
    return;
  }
  set.headers.etag = hash.toString();
  set.headers.age = `${Date.now() - file.lastModified}`;
  if (config.env.NODE_ENV === "production")
    set.headers["Cache-Control"] = "public, max-age=31536000";
  return file;
}
