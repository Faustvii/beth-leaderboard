import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getCurrentAdmins } from "../db/queries/userQueries";
import { isHxRequest } from "../lib";

export const Help = new Elysia({
  prefix: "/help",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => helpPage(session, headers));
  });

async function helpPage(
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
  const admins = await getCurrentAdmins();

  return (
    <>
      <NavbarHtml session={session} activePage="help" />
      <HeaderHtml title="Help" />
      <p class="pl-5">
        If you need help deleting or editing a match, you can write one of the
        admins below
      </p>
      <StatsCardHtml title="Current Admins" doubleSize>
        <div class="flex flex-col gap-3">
          {admins.map((user) => (
            <p>{user.name}</p>
          ))}
        </div>
      </StatsCardHtml>
    </>
  );
}
