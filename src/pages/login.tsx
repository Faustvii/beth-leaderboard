import { Elysia } from "elysia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { ctx } from "../context";

export const login = new Elysia({ prefix: "/login" })
  .use(ctx)
  .get("/", async ({ html, session }) => {
    return html(() => (
      <LayoutHtml>
        <NavbarHtml session={session} activePage="leaderboard" />
        <HeaderHtml title="Leaderboard" />

        <a hx-boost="false" href="/api/auth/signin/google">
          Login with google
        </a>
        <a hx-boost="false" href="/api/auth/signin/azure">
          Login with azure
        </a>
        <a hx-boost="false" href="/api/auth/signin/local">
          Login for testing
        </a>
      </LayoutHtml>
    ));
  });
