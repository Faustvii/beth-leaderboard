import "@kitajs/html/register";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Elysia } from "elysia";
import { api } from "./controllers/*";
import { writeDb } from "./db";
import { pages } from "./pages/*";
import { staticController } from "./staticFiles";
import { webSockets } from "./websockets/*";

console.log("migrating database");
await migrate(writeDb, { migrationsFolder: "./drizzle" });
console.log("database migrated");

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
