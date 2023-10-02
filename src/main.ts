import "@kitajs/html/register";
import { Elysia } from "elysia";
import { config } from "./config";
import { api } from "./controllers/*";
import { pages } from "./pages/*";
import { staticController } from "./staticFiles";

const app = new Elysia()
  .use(staticController)
  .use(api)
  .use(pages)
  .onStart(() => {
    if (config.env.NODE_ENV === "development") {
      void fetch("http://localhost:3001/restart");
      console.log("Triggering Live Reload");
    }
  })
  .onError(({ error }) => {
    console.error(error);
  })
  .listen(3000);

export type App = typeof app;

console.log(
  `app is listening on http://${app.server?.hostname}:${app.server?.port}`,
);
