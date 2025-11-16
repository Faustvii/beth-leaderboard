import { type BunFile } from "bun";
import Elysia from "elysia";
import { type HTTPStatusName } from "elysia/utils";
import { config } from "./config";
import { getUserWithPicture } from "./db/queries/userQueries";
import { isBase64, resizeImage } from "./lib/userImages";

const fileExistLookup = new Map<string, boolean>();
const fileHashLookup = new Map<string, string>();

export const staticController = new Elysia({
  prefix: "/static",
})
  .get("/styles.css", async (ctx) => {
    const fileName = "public/styles.css";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/favicon.ico", (ctx) => {
    const fileName = "public/favicon.ico";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/bar.svg", (ctx) => {
    const fileName = "public/bar.min.svg";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/crokinole-christmas.avif", (ctx) => {
    const fileName = "public/crokinole-christmas.avif";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/crokinole.svg", (ctx) => {
    const fileName = "public/crokinole-c.min.svg";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/foldable-open.png", (ctx) => {
    const fileName = "public/foldable-open.png";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/foldable-closed.png", (ctx) => {
    const fileName = "public/foldable-closed.png";
    const file = Bun.file(fileName);
    return etagFileServe(file, fileName, ctx.set, ctx.headers);
  })
  .get("/user/:id", async (ctx) => {
    const fileName = `public/user/${ctx.params.id}.webp`;
    const result = await userPicture(ctx.params.id, fileName);
    if (result instanceof Response) return result;
    return etagFileServe(result, fileName, ctx.set, ctx.headers);
  })
  .get("/user/:id/small", async (ctx) => {
    const fileName = `public/user/${ctx.params.id}-32x32.webp`;
    const result = await userPicture(ctx.params.id, fileName, {
      width: 32,
      height: 32,
    });
    if (result instanceof Response) return result;
    return etagFileServe(result, fileName, ctx.set, ctx.headers);
  });

async function etagFileServe(
  file: BunFile,
  fileName: string,
  set: {
    headers: Record<string, string> & {
      "Set-Cookie"?: string | string[];
    };
    status?: number | HTTPStatusName;
    redirect?: string;
  },
  headers: Record<string, string | null>,
) {
  let hash = fileHashLookup.get(fileName);
  if (!hash) {
    hash = Bun.hash(await file.arrayBuffer()).toString();
    fileHashLookup.set(fileName, hash);
  }

  const expectedHash = headers["if-none-match"];
  if (expectedHash === hash) {
    set.status = "Not Modified";
    return;
  }
  set.headers.etag = hash;
  set.headers.age = `${Date.now() - file.lastModified}`;
  if (config.env.NODE_ENV === "production")
    set.headers["Cache-Control"] = "public, max-age=31536000";
  return file;
}

async function userPicture(
  id: string,
  fileName: string,
  resize?: { width: number; height: number },
) {
  let file = Bun.file(fileName);
  let exists = fileExistLookup.get(fileName);
  if (!exists) {
    exists = await file.exists();
  }
  fileExistLookup.set(fileName, exists);

  if (!exists) {
    const dbUser = await getUserWithPicture(id);
    if (!dbUser) {
      return new Response(null, { status: 404 });
    }

    if (!isBase64(dbUser.picture) || dbUser.picture === "")
      return Bun.file("public/default-user-small.webp");

    const picture = resize
      ? await resizeImage(dbUser.picture, { ...resize })
      : dbUser.picture;
    const pictureBuffer = Buffer.from(picture, "base64");
    await Bun.write(fileName, pictureBuffer.buffer);
    fileHashLookup.set(fileName, Bun.hash(pictureBuffer).toString());
    file = Bun.file(fileName);
  }
  return file;
}
