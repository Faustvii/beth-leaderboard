import "@kitajs/html/register";
import { readableStreamToText } from "bun";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Elysia } from "elysia";
import { config } from "./config";
import { api } from "./controllers/*";
import { writeDb } from "./db";
import { pages } from "./pages/*";
import { staticController } from "./staticFiles";
import { webSockets } from "./websockets/*";

console.log("migrating database");
await migrate(writeDb, { migrationsFolder: "./drizzle" });
console.log("database migrated");

if (config.env.NODE_ENV === "preprod") {
  console.log("starting database seeding");
  const { stdout } = Bun.spawn(["bun", "./src/db/seed.ts"]);
  const text = await readableStreamToText(stdout);
  console.log(text);
  console.log("database seeding complete");
}

const app = new Elysia()
  .use(webSockets)
  .use(staticController)
  .use(api)
  .use(pages)
  .onError(({ error }) => {
    console.error(error);
  })
  .listen(3000);
export type App = typeof app;

console.log(
  `app is listening on http://${app.server?.hostname}:${app.server?.port}`,
);
