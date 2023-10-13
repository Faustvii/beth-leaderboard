import "@kitajs/html/register";
import { Elysia } from "elysia";
import { api } from "./controllers/*";
import { pages } from "./pages/*";
import { staticController } from "./staticFiles";
import { webSockets } from "./websockets/*";

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
