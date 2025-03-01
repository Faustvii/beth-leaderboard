import { type PropsWithChildren } from "@kitajs/html";
import { type Session } from "lucia";
import { AnchorButtonHtml } from "./Button";
import "@kitajs/html/register";
import { cn } from "../lib/utils";
import { HxButton } from "./HxButton";

export type Page =
  | "leaderboard"
  | "stats"
  | "match"
  | "profile"
  | "admin"
  | "help"
  | "result";

interface Props extends PropsWithChildren {
  session: Session | null;
  activePage: Page;
}

interface NavbarRoute {
  name: string;
  page: Page;
  route: string;
  roles?: string[];
}

const pageRoutes: NavbarRoute[] = [
  { name: "Leaderboard", page: "leaderboard", route: "/leaderboard" },
  { name: "Log match", page: "match", route: "/match" },
  { name: "Stats", page: "stats", route: "/stats" },
  { name: "Help", page: "help", route: "/help" },
  { name: "Admin", page: "admin", route: "/admin", roles: ["admin"] },
];

const profileRoutes: NavbarRoute[] = [
  { name: "Profile", page: "profile", route: "/profile" },
];

export const NavbarHtml = async ({ session, activePage }: Props) => {
  const userRoles = session?.user.roles?.split(",") ?? [];
  const routes = pageRoutes.filter(
    (x) => !x.roles || x.roles?.every((x) => userRoles.includes(x)),
  );

  const toggleMobileMenuHyperscript = `on click toggle [@data-open] on #mobile-menu-button then toggle between .block and .hidden on #mobile-menu`;
  const toggleUserMenuHyperscript = `on click toggle between .block and .hidden on #user-menu`;

  return (
    <nav>
      <div class="mx-auto px-2 sm:px-6 lg:px-8">
        <div class="relative flex h-16 items-center justify-between">
          <div class="absolute inset-y-0 left-0 flex items-center lg:hidden">
            <button
              type="button"
              id="mobile-menu-button"
              class="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              _={toggleMobileMenuHyperscript}
            >
              <span class="absolute -inset-0.5"></span>
              <svg
                id="mobile-menu-open"
                class="block h-6 w-6 group-data-[open]:hidden"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              <svg
                id="mobile-menu-close"
                class="hidden h-6 w-6 group-data-[open]:block"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="flex flex-1 items-center justify-center lg:items-stretch lg:justify-start">
            <div class="flex flex-shrink-0 items-center">
              <HxButton hx-get="/">
                <img
                  class="h-8 w-auto"
                  src="/static/crokinole.svg"
                  alt="Crokinole"
                />
              </HxButton>
            </div>
            <div class="hidden lg:ml-6 lg:block">
              <div class="flex w-full items-center justify-center space-x-4">
                {routes.map(({ name, page, route }) =>
                  navBarButton(name, page, activePage, route),
                )}
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2 lg:static lg:inset-auto lg:ml-6 lg:pr-0">
            {session ? (
              <>
                <div class="relative ml-3">
                  <div>
                    <button
                      type="button"
                      class="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                      id="user-menu-button"
                      _={toggleUserMenuHyperscript}
                    >
                      <span class="absolute -inset-1.5"></span>
                      <img
                        class="h-8 w-8 rounded-full"
                        loading="lazy"
                        src={`/static/user/${session.user.id}/small`}
                        alt="Pic"
                      />
                    </button>
                  </div>
                  <div
                    class="absolute right-0 z-10 mt-2 hidden w-28 origin-top-right rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    id="user-menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabindex="-1"
                  >
                    <ul>
                      {profileRoutes.map(({ name, route }) => (
                        <li>
                          <HxButton
                            hx-get={route}
                            class="rounded-md px-3 py-2 text-sm font-medium"
                            role="menuitem"
                            tabindex="-1"
                          >
                            {name}
                          </HxButton>
                        </li>
                      ))}
                      <li>
                        <a
                          href="/api/auth/signout"
                          class="rounded-md px-3 py-2 text-sm font-medium"
                          role="menuitem"
                          tabindex="-1"
                        >
                          Sign out
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AnchorButtonHtml
                  class="relative flex rounded-full text-sm text-gray-400 hover:bg-gray-700 hover:text-white focus:text-white "
                  href="/api/auth/signin/azure"
                  hx-boost="false"
                >
                  <span class="absolute -inset-1.5"></span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="h-6 w-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </AnchorButtonHtml>
              </>
            )}
          </div>
        </div>
      </div>

      <div class="hidden" id="mobile-menu">
        <div class="space-y-1 px-2 pb-3 pt-2">
          {routes.map(({ name, page, route }) =>
            navBarButton(
              name,
              page,
              activePage,
              route,
              "block rounded-md px-3 py-2 text-base font-medium",
            ),
          )}
        </div>
      </div>
    </nav>
  );
};

function isActivePage(page: Page, activePage: Page) {
  return page === activePage;
}

const navBarButton = (
  text: string,
  page: Page,
  activePage: Page,
  href?: string,
  classes?: string,
) =>
  isActivePage(page, activePage) ? (
    <span
      class={cn(
        "rounded px-3 py-2 text-sm font-bold hover:bg-primary/50",
        { "bg-primary hover:bg-primary": isActivePage(page, activePage) },
        { classes: classes !== undefined },
      )}
    >
      {text}
    </span>
  ) : (
    <button
      {...(href && { "hx-get": href })}
      hx-indicator=".progress-bar"
      hx-target="#mainContainer"
      hx-swap="innerHTML"
      hx-push-url="true"
      class={cn("rounded px-3 py-2 text-sm font-bold hover:bg-primary/50", {
        "bg-primary hover:bg-primary": isActivePage(page, activePage),
      })}
    >
      {text}
    </button>
  );
