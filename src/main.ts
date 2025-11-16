import "@kitajs/html/register";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Elysia } from "elysia";
import { api } from "./controllers/*";
import { Christmas, updateIsItChristmas } from "./controllers/christmas";
import { writeDb } from "./db";
import { SeedDatabase } from "./db/seed";
import { pages } from "./pages/*";
import { staticController } from "./staticFiles";

console.log("migrating database");
await migrate(writeDb, { migrationsFolder: "./drizzle" });
console.log("database migrated");

updateIsItChristmas();

const app = new Elysia()
  .use(staticController)
  .use(api)
  .use(pages)
  .use(Christmas)
  .onError(({ error }) => {
    console.error(error);
  })
  .listen(3000);
export type App = typeof app;

console.log(
  `app is listening on http://${app.server?.hostname}:${app.server?.port}`,
);

await SeedDatabase(writeDb);
