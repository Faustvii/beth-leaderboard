import { OAuthRequestError } from "@lucia-auth/oauth";
import { type AzureADUser } from "@lucia-auth/oauth/providers";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { LuciaError } from "lucia";
import { parseCookie, serializeCookie } from "lucia/utils";
import { azureAuth } from "../auth";
import { config } from "../config";
import { ctx } from "../context";
import { userTbl as userSchema } from "../db/schema/auth";
import { syncIfLocal } from "../lib/dbHelpers";

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
  // .get("/signin/google", async ({ set }) => {
  //   const [url, state] = await googleAuth.getAuthorizationUrl();
  //   const stateCookie = serializeCookie("google_auth_state", state, {
  //     maxAge: 60 * 60,
  //     secure: config.env.NODE_ENV === "production",
  //     httpOnly: true,
  //     path: "/",
  //   });

  //   set.headers["Set-Cookie"] = stateCookie;
  //   set.redirect = url.toString();
  // })
  // .get("/signin/local/", async ({ set, query, writeAuth, readDb }) => {
  //   try {
  //     // This is for test purposes only
  //     const email = `fake${query.user ?? 0}@fake.crokinole`;

  //     // Check if the user exists
  //     const existingUser = await readDb.query.userTbl.findFirst({
  //       where: eq(userSchema.email, email),
  //     });

  //     if (!existingUser) {
  //       set.status = "Not Found";
  //       return "User not found";
  //     }

  //     // Create a new session for the user
  //     const session = await writeAuth.createSession({
  //       userId: existingUser.id,
  //       attributes: {},
  //     });

  //     const sessionCookie = writeAuth.createSessionCookie(session);
  //     await syncIfLocal();

  //     set.headers["Set-Cookie"] = sessionCookie.serialize();
  //     set.redirect = "/";
  //   } catch (error) {
  //     console.error("Error in local signin:", error);
  //     set.status = "Internal Server Error";
  //     return "An error occurred during signin";
  //   }
  // })
  .get("/signin/azure", async ({ set }) => {
    const [url, codeVerifier, state] = await azureAuth.getAuthorizationUrl();
    const stateCookie = serializeCookie("azure_auth_state", state, {
      maxAge: 60 * 60,
      secure: config.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    });

    const codeVerifierCookie = serializeCookie(
      "azure_auth_code_verifier",
      codeVerifier,
      {
        maxAge: 60 * 60,
        secure: config.env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
      },
    );

    set.headers["Set-Cookie"] = [stateCookie, codeVerifierCookie];
    set.redirect = url.toString();
  })
  .get(
    "/azure/callback",
    async ({ set, query, headers, writeAuth, redirect, readDb }) => {
      const { code, state } = query;
      const cookies = parseCookie(headers.cookie || "");
      const state_cookie = cookies.azure_auth_state;
      const verifier_cookie = cookies.azure_auth_code_verifier;

      if (
        !state_cookie ||
        !state ||
        state_cookie !== state ||
        !code ||
        !verifier_cookie
      ) {
        console.warn("Invalid state or code", {
          state,
          code,
          verifier_cookie,
          state_cookie,
        });
        set.status = "Unauthorized";
        return;
      }

      try {
        const { createUser, getExistingUser, azureADUser, createKey } =
          await azureAuth.validateCallback(code, verifier_cookie);

        if (!azureADUser) {
          set.status = "Unauthorized";
          console.log("No user returned from azureAD");
          return;
        }
        const normalizedAzureUser = normalizeAzureADUser(azureADUser);
        console.log("azureADUser", normalizedAzureUser);

        const getUser = async () => {
          const existingUser = await getExistingUser().catch((err) => {
            if (
              err instanceof LuciaError &&
              err.message === "AUTH_INVALID_USER_ID"
            )
              return null;
            else throw err;
          });
          console.log("existingUser", existingUser);
          if (existingUser) {
            return existingUser;
          }
          if (normalizedAzureUser.email) {
            console.log("linking existing user with azureAd");
            const existingDbUser = await readDb.query.userTbl.findFirst({
              where: eq(userSchema.email, normalizedAzureUser.email),
            });

            if (existingDbUser) {
              const existUser = writeAuth.transformDatabaseUser(existingDbUser);
              await createKey(existUser.userId);
              return existUser;
            }
          }

          console.log("creating user", normalizedAzureUser);
          const name = normalizedAzureUser.name
            ? normalizedAzureUser.name
            : `${normalizedAzureUser.given_name} ${normalizedAzureUser.family_name}`;
          const newUser = await createUser({
            attributes: {
              name: name,
              email: normalizedAzureUser.email ?? null,
              picture: normalizedAzureUser.picture ?? null,
              roles:
                config.env.NODE_ENV !== "production" &&
                config.env.DATABASE_CONNECTION_TYPE === "local"
                  ? "admin"
                  : null,
            },
          });

          return newUser;
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
        console.log(error, "Error in azure auth callback");
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

function normalizeAzureADUser(
  user: AzureADUser | AzurePersonalADUser,
): AzureADUser {
  const normalizedUser: AzureADUser = {
    sub: user.sub,
    picture: user.picture,
    name: user.name,
    family_name: "",
    given_name: "",
  };

  if (user.email) {
    normalizedUser.email = user.email;
  }

  if ("familyname" in user) {
    normalizedUser.family_name = user.familyname;
    normalizedUser.given_name = user.givenname;
  } else {
    normalizedUser.family_name = user.family_name;
    normalizedUser.given_name = user.given_name;
  }

  return normalizedUser;
}

export interface AzurePersonalADUser {
  sub: string;
  name: string;
  familyname: string;
  givenname: string;
  picture: string;
  email?: string;
}
