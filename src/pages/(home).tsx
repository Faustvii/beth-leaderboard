import { Elysia } from "elysia";
import { authed } from "../auth/middleware";
import { BaseHtml } from "../components/base";
import { HeaderHtml } from "../components/header";
import { SearchHtml } from "../components/Search";
import { ctx } from "../context";

export const home = new Elysia()
  .use(ctx)
  .use(authed)
  .get("/", ({ html, session }) => {
    return html(() => (
      <BaseHtml session={session}>
        <HeaderHtml></HeaderHtml>
        <div class="flex flex-col items-center py-3">
          <span>1. Champ</span>
          <span>2. Junior</span>
        </div>
        <SearchHtml></SearchHtml>
      </BaseHtml>
    ));
  });
