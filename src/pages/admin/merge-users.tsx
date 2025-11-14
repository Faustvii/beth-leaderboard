import { type ResultSet } from "@libsql/client";
import { eq, type ExtractTablesWithRelations } from "drizzle-orm";
import { type LibSQLDatabase } from "drizzle-orm/libsql";
import { type SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Elysia, t } from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../../components/header";
import { LayoutHtml } from "../../components/Layout";
import { NavbarHtml } from "../../components/Navbar";
import { StatsCardHtml } from "../../components/StatsCard";
import { UserLookUp } from "../../components/UserLookup";
import { ctx } from "../../context";
import { getUser } from "../../db/queries/userQueries";
import { userTbl, type User } from "../../db/schema/auth";
import type * as DB from "../../db/schema/index";
import {
  key,
  matches,
  questTbl,
  ratingEventTbl,
  session,
} from "../../db/schema/index";
import { isHxRequest } from "../../lib";
import { syncIfLocal } from "../../lib/dbHelpers";

type Transaction = SQLiteTransaction<
  "async",
  ResultSet,
  typeof DB,
  ExtractTablesWithRelations<typeof DB>
>;

export const MergeUsers = new Elysia({
  prefix: "/merge-users",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => mergeUsersPage(session, headers));
  })
  .post(
    "/",
    async ({ body: { targetId, sourceId }, writeDb }) => {
      try {
        await handleMergeUsers(targetId, sourceId, writeDb);
        await syncIfLocal();
        return new Response("OK", { status: 200 });
      } catch (error: unknown) {
        if (error instanceof Error) {
          return new Response(error.message, { status: 200 });
        }

        console.error("Unknown error when merging users", error);
        return new Response("Error merging users", { status: 500 });
      }
    },
    {
      beforeHandle: ({ body }) => {
        if (body.targetId === body.sourceId) {
          return new Response("Target and source user cannot be the same", {
            status: 400,
          });
        }
        return;
      },
      body: t.Object({
        targetId: t.String({ minLength: 1 }),
        sourceId: t.String({ minLength: 1 }),
      }),
    },
  );

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

async function handleMergeUsers(
  targetUserId: string,
  sourceUserId: string,
  writeDb: LibSQLDatabase<typeof DB>,
): Promise<void> {
  const targetUser = await getUser(targetUserId, true);
  const sourceUser = await getUser(sourceUserId, true);

  if (!targetUser || !sourceUser) {
    throw new Error("User not found");
  }

  if (isGuest(targetUser) && !isGuest(sourceUser)) {
    throw new Error(
      "Target user is a guest and source user is not, doing that would make it impossible to login",
    );
  }

  console.log(
    `merging users targetUserId: ${targetUserId} sourceUserId: ${sourceUserId}`,
  );

  await writeDb.transaction(async (trx) => {
    await transferUserSessions(targetUserId, sourceUserId, trx);

    await transferMatches(targetUserId, sourceUserId, trx);
    await transferQuests(targetUserId, sourceUserId, trx);
    await transferRatingEvents(targetUserId, sourceUserId, trx);

    await deleteUserKeys(sourceUserId, trx);
    await deleteUser(sourceUserId, trx);
  });
}

function isGuest(user: User) {
  return user.email === null;
}

async function transferUserSessions(
  targetUserId: string,
  sourceUserId: string,
  trx: Transaction,
) {
  await trx
    .update(session)
    .set({ userId: targetUserId })
    .where(eq(session.userId, sourceUserId));
}

async function transferMatches(
  targetUserId: string,
  sourceUserId: string,
  trx: Transaction,
) {
  await trx
    .update(matches)
    .set({ whitePlayerOne: targetUserId })
    .where(eq(matches.whitePlayerOne, sourceUserId));
  await trx
    .update(matches)
    .set({ whitePlayerTwo: targetUserId })
    .where(eq(matches.whitePlayerTwo, sourceUserId));
  await trx
    .update(matches)
    .set({ blackPlayerOne: targetUserId })
    .where(eq(matches.blackPlayerOne, sourceUserId));
  await trx
    .update(matches)
    .set({ blackPlayerTwo: targetUserId })
    .where(eq(matches.blackPlayerTwo, sourceUserId));
}

async function transferQuests(
  targetUserId: string,
  sourceUserId: string,
  trx: Transaction,
) {
  await trx
    .update(questTbl)
    .set({ playerId: targetUserId })
    .where(eq(questTbl.playerId, sourceUserId));
}

async function transferRatingEvents(
  targetUserId: string,
  sourceUserId: string,
  trx: Transaction,
) {
  await trx
    .update(ratingEventTbl)
    .set({ playerId: targetUserId })
    .where(eq(ratingEventTbl.playerId, sourceUserId));
}

async function deleteUserKeys(userId: string, trx: Transaction) {
  await trx.delete(key).where(eq(key.userId, userId));
}

async function deleteUser(userId: string, trx: Transaction) {
  await trx.delete(userTbl).where(eq(userTbl.id, userId));
}
