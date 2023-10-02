import { OAuthRequestError } from "@lucia-auth/oauth";
import { Elysia } from "elysia";
import { parseCookie, serializeCookie } from "lucia/utils";
import { googleAuth } from "../auth";
import { config } from "../config";
import { ctx } from "../context";
import { syncIfLocal } from "../lib";

export const authController = new Elysia({
  prefix: "/auth",
})
  .use(ctx)
  .get("/signout", async (ctx) => {
    const { redirect } = ctx;
    const authRequest = ctx.writeAuth.handleRequest(ctx);
    const session = await authRequest.validate();

    if (!session) {
      ctx.set.status = "Unauthorized";
      redirect(ctx, "/");
      return;
    }

    await ctx.writeAuth.invalidateSession(session.sessionId);

    const sessionCookie = ctx.writeAuth.createSessionCookie(null);

    ctx.set.headers["Set-Cookie"] = sessionCookie.serialize();
    redirect(ctx, "/");
  })
  .get("/signin/google", async ({ set }) => {
    const [url, state] = await googleAuth.getAuthorizationUrl();
    const stateCookie = serializeCookie("google_auth_state", state, {
      maxAge: 60 * 60,
      secure: config.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    });

    set.headers["Set-Cookie"] = stateCookie;
    set.redirect = url.toString();
  })
  .get(
    "/google/callback",
    async ({ set, query, headers, writeAuth, redirect }) => {
      const { code, state } = query;

      const cookies = parseCookie(headers.cookie || "");
      const state_cookie = cookies.google_auth_state;

      if (!state_cookie || !state || state_cookie !== state || !code) {
        console.warn("Invalid state or code", { state, code });
        set.status = "Unauthorized";
        return;
      }

      try {
        const { createUser, getExistingUser, googleUser } =
          await googleAuth.validateCallback(code);

        const getUser = async () => {
          const existingUser = await getExistingUser();
          if (existingUser) return existingUser;

          const user = await createUser({
            attributes: {
              name: googleUser.name,
              elo: 1500,
              email: googleUser.email ?? null,
              picture: googleUser.picture,
            },
          });

          return user;
        };

        const user = await getUser();
        const session = await writeAuth.createSession({
          userId: user.userId,
          attributes: {},
        });
        const sessionCookie = writeAuth.createSessionCookie(session);
        await syncIfLocal();

        set.headers["Set-Cookie"] = sessionCookie.serialize();
        redirect({ set, headers }, "/");
      } catch (error) {
        console.log(error, "Error in google auth callback");
        if (error instanceof OAuthRequestError) {
          set.status = "Unauthorized";
          return;
        } else {
          set.status = "Internal Server Error";
          return;
        }
      }
    },
  );
