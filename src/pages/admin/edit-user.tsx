import clsx from "clsx";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { ctx } from "../../context";
import { listAllUsers, listUsersByName } from "../../db/queries/userQueries";
import { userTbl } from "../../db/schema/auth";
import { redirect } from "../../lib";
import { syncIfLocal } from "../../lib/dbHelpers";
import { SearchIcon } from "../../lib/icons";
import { EditUserCard } from "./components/EditUserCard";
import { EditUserModal } from "./components/EditUserModal";
import { EditUserSearchResults } from "./components/EditUserSearchResults";

export const EditUser = new Elysia({
  prefix: "/edit-user",
})
  .use(ctx)
  .get("/", async ({ html, headers }) => {
    return html(() => editUserPage(headers));
  })
  .get(
    "/search",
    async ({ html, query: { name } }) => {
      if (!name || name === "") return;
      const results = await listUsersByName(name, 5);
      return html(() => EditUserSearchResults({ results }));
    },
    {
      query: t.Partial(
        t.Object({
          name: t.String(),
        }),
      ),
    },
  )
  .get("/:userId", async ({ params: { userId }, readDb }) => {
    const user = await readDb.query.userTbl.findFirst({
      columns: { id: true, name: true, nickname: true },
      where: eq(userTbl.id, userId),
    });
    if (!user) return;
    return <EditUserModal user={user} />;
  })
  .put(
    "/",
    async ({
      body: { userId, fullName, nickname },
      writeDb,
      readDb,
      set,
      headers,
    }) => {
      const existing = await readDb.query.userTbl.findFirst({
        columns: { id: true },
        where: eq(userTbl.id, userId),
      });
      if (!existing) {
        return new Response("User not found", { status: 400 });
      }

      await writeDb
        .update(userTbl)
        .set({ name: fullName, nickname })
        .where(eq(userTbl.id, userId));
      await syncIfLocal();

      redirect({ headers, set }, `/profile/${userId}`);
    },
    {
      beforeHandle: (_) => undefined,
      body: t.Object({
        userId: t.String({ minLength: 1 }),
        fullName: t.String({ minLength: 1 }),
        nickname: t.String({ minLength: 1, maxLength: 30 }),
      }),
    },
  );

async function editUserPage(headers: Record<string, string | null>) {
  return <LayoutHtml headers={headers}>{await page()}</LayoutHtml>;
}

async function page() {
  const allUsers = await listAllUsers();

  return (
    <>
      <NavbarHtml activePage="admin" />
      <HeaderHtml title="Edit user" />
      <div class="flex w-full flex-col gap-3 p-6">
        <div class="group relative w-full">
          <SearchIcon />
          <input
            id="edit-user-search-input"
            hx-trigger="keyup[event.key !== 'Enter'] changed delay:300ms"
            hx-sync="this:replace"
            hx-swap="innerHtml"
            hx-get="/admin/edit-user/search"
            hx-indicator=".progress-bar"
            hx-target="#edit-user-search-results"
            hx-params="name"
            name="name"
            placeholder=" "
            autocomplete="off"
            class={clsx([
              "peer block w-full appearance-none px-0 py-2.5 pl-10 text-sm",
              "border-0 border-b-2 border-gray-300 bg-transparent",
              "focus:border-blue-500 focus:outline-none focus:ring-0",
            ])}
            _="on focus remove @hidden from #edit-user-search-results"
          />
          <label
            for="edit-user-search-input"
            class={clsx([
              "absolute top-3 -z-10 origin-[0] pl-10 text-sm text-gray-400",
              "-translate-y-6 scale-75 transform duration-300",
              "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
              "peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:pl-0 peer-focus:font-medium peer-focus:text-blue-500",
            ])}
          >
            Search by name
          </label>
          <div
            id="edit-user-search-results"
            class={clsx([
              "mt-1 max-h-[50vh] overflow-y-auto rounded-b-lg bg-slate-600",
              "shadow-md shadow-slate-900/5",
            ])}
          />
        </div>

        <div class="mt-8 w-full">
          <h2 class="mb-3 text-xl font-semibold">All users</h2>
          {allUsers.length !== 0 ? (
            <div class="flex w-full flex-col flex-wrap justify-between lg:flex-row">
              {allUsers.map((u) => (
                <EditUserCard user={u} />
              ))}
            </div>
          ) : (
            <span class="text-sm text-gray-500">No users yet</span>
          )}
        </div>
      </div>
    </>
  );
}
