import Elysia from "elysia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { getCurrentAdmins } from "../db/queries/userQueries";
import { getCurrentUser } from "../lib/store";

export const Help = new Elysia({
  prefix: "/help",
})
  .use(ctx)
  .get("/", async ({ html, headers }) => {
    return html(() => helpPage(headers));
  });

async function helpPage(headers: Record<string, string | null>) {
  return <LayoutHtml headers={headers}>{page()}</LayoutHtml>;
}

async function page() {
  const user = getCurrentUser();
  const admins = await getCurrentAdmins(!!user);

  return (
    <>
      <NavbarHtml activePage="help" />
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
