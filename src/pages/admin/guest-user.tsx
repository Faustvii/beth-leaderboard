import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { generateRandomString } from "lucia/utils";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import { userTbl, type User } from "../../db/schema/auth";
import { redirect } from "../../lib";
import { syncIfLocal } from "../../lib/dbHelpers";
import { UserForm } from "./components/UserForm";

export const GuestUser = new Elysia({
  prefix: "/guest-user",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => guestUserPage(session, headers));
  })
  .put(
    "/",
    async ({ set, headers, body: { name, nickname }, writeDb }) => {
      const guestName = `${name} (Guest)`;
      const userToInsert: Omit<User, "picture"> = {
        id: generateRandomString(15),
        name: guestName,
        email: null,
        roles: null,
        nickname: nickname,
      };

      const [{ id: userId }] = await writeDb
        .insert(userTbl)
        .values(userToInsert)
        .returning();
      await syncIfLocal();

      redirect({ headers, set }, `/profile/${userId}`);
    },
    {
      beforeHandle: (_) => undefined,
      body: t.Object({
        name: t.String({ minLength: 1 }),
        nickname: t.String({ minLength: 1 }),
      }),
    },
  );

export async function guestUserPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return <LayoutHtml headers={headers}>{page(session)}</LayoutHtml>;
}

async function page(session: Session | null) {
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="Create guest user" />
      <div class="flex w-full flex-col gap-3">
        <UserForm formId="createGuestUser"></UserForm>
      </div>
    </>
  );
}
