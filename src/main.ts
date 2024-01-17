import staticPlugin from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Elysia } from "elysia";
import { config } from "./config";
import { api } from "./controllers/*";
import { writeDb } from "./db";
import { pages } from "./pages/*";
import { webSockets } from "./websockets/*";

console.log("migrating database");
await migrate(writeDb, { migrationsFolder: "./drizzle" });
console.log("database migrated");

const app = new Elysia()
  .use(swagger())
  .use(staticPlugin())
  .use(webSockets)
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

await startUpTasks(app);

async function startUpTasks(app: App) {
  const seedCron = app.store.cron["seed-database"];
  const imageCron = app.store.cron["generate-image-assets"];
  if (config.env.NODE_ENV === "preprod") {
    await seedCron.trigger();
    while (seedCron.isBusy()) {
      await Bun.sleep(1000);
      console.log("waiting for database seeding cron job to finish");
    }
  }

  await imageCron.trigger();
  while (imageCron.isBusy()) {
    await Bun.sleep(1000);
    console.log("waiting for user image asset generation cron job to finish");
  }
  console.log("user image asset generation cron job finished");
  imageCron.stop();
}
