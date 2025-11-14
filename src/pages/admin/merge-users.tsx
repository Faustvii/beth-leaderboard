import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { StatsCardHtml } from "../../components/StatsCard";
import { UserLookUp } from "../../components/UserLookup";
import { ctx } from "../../context";
import { isHxRequest } from "../../lib";

export const MergeUsers = new Elysia({
  prefix: "/merge-users",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => mergeUsersPage(session, headers));
  })
  .post("/", ({ body }) => {
    console.log(body);
    return new Response("OK", { status: 200 });
  });

export async function mergeUsersPage(
  session: Session | null,
  headers: Record<string, string | null>,
) {
  return (
    <>
      {isHxRequest(headers) ? (
        page(session)
      ) : (
        <LayoutHtml>{page(session)}</LayoutHtml>
      )}
    </>
  );
}

async function page(session: Session | null) {
  return (
    <>
      <NavbarHtml session={session} activePage="admin" />
      <HeaderHtml title="Merge Users" />
      <div class="pl-5">
        <ul class="list-inside list-disc pl-5">
          <li>Transfers session from source user to target user</li>
          <li>Deletes user keys from source user</li>
          <li>Transfers matches from source user to target user</li>
          <li>Transfers quests from source user to target user</li>
          <li>Transfers rating events from source user to target user</li>
          <li>Deletes source user from database</li>
        </ul>
        <p class="mt-4">
          <em class="text-lg font-bold italic text-red-500">
            Note: This is a destructive operation and cannot be undone.
          </em>
        </p>
      </div>
      <StatsCardHtml title="⚠️ Merge Users" doubleSize>
        <MergeUsersForm />
      </StatsCardHtml>
    </>
  );
}

function MergeUsersForm() {
  const formId = "merge-users-form";

  return (
    <form
      class="flex w-full flex-col"
      method="post"
      id={formId}
      hx-ext="response-targets"
      enctype="multipart/form-data"
      hx-indicator=".progress-bar"
      hx-sync="this:abort"
      hx-swap="outerHTML"
      hx-target={`#${formId}`}
      hx-params="not name"
      hx-target-400="#errors"
    >
      <div class="group relative mb-6 w-full">
        <UserLookUp
          formId={formId}
          label="Target user"
          input="target"
          required={true}
        />
      </div>
      <div class="group relative mb-6 w-full">
        <UserLookUp
          formId={formId}
          label="Source user (will be deleted)"
          input="source"
          required={true}
        />
      </div>
      <button
        hx-post="/admin/merge-users"
        type="submit"
        class="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
      >
        Merge users
      </button>
    </form>
  );
}
