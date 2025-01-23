import Elysia from "elysia";
import { type Session } from "lucia";
import { HeaderHtml } from "../components/header";
import { LayoutHtml } from "../components/Layout";
import { NavbarHtml } from "../components/Navbar";
import { StatsCardHtml } from "../components/StatsCard";
import { ctx } from "../context";
import { isHxRequest } from "../lib";

interface NewsItem {
  title: string;
  date: string;
  description: string;
}

export const News = new Elysia({
  prefix: "/news",
})
  .use(ctx)
  .get("/", async ({ html, session, headers }) => {
    return html(() => newsPage(session, headers));
  });

async function newsPage(
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
  const news = [
    {
      title: "Guest users",
      date: "23-01-2025",
      description:
        'It\'s now possible for admins to create guest users like our friends or the renters in the glass room. Reach out to an admin to register a guest at start logging matches. Admins can be found in the "help" menu item.',
    },
  ];

  return (
    <>
      <NavbarHtml session={session} activePage="help" />
      <HeaderHtml title="News" />
      {news.map((x) => newsCard(x))}
    </>
  );
}

function newsCard(newsItem: NewsItem) {
  return (
    <StatsCardHtml title={`${newsItem.title} - ${newsItem.date}`} doubleSize>
      <p> {newsItem.description} </p>
    </StatsCardHtml>
  );
}
