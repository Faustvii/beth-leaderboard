import { type PropsWithChildren } from "@kitajs/html";
import { type Session } from "lucia";
import { AnchorButtonHtml } from "./Button";
import "@kitajs/html/register";

export type Page = "leaderboard" | "play" | "stats" | "match";

interface Props extends PropsWithChildren {
  session: Session | null;
  activePage: Page;
}

export const NavbarHtml = ({ session, activePage }: Props) => (
  <>
    <script>
      {function toggleMobileMenu() {
        const mobileMenu = document?.getElementById("mobile-menu");
        const mobileMenuIcon = document?.getElementById("mobile-menu-open");
        const mobileCloseIcon = document?.getElementById("mobile-menu-close");
        if (!mobileMenu || !mobileMenuIcon || !mobileCloseIcon) return;
        if (mobileMenu.classList?.contains("visible")) {
          mobileMenu.classList?.replace("visible", "hidden");
          mobileMenuIcon.classList?.replace("hidden", "block");
          mobileCloseIcon.classList?.replace("block", "hidden");
        } else {
          mobileMenu.classList?.replace("hidden", "visible");
          mobileMenuIcon.classList?.replace("block", "hidden");
          mobileCloseIcon.classList?.replace("hidden", "block");
        }
      }}
      {function toggleUserMenu() {
        const userMenu = document.getElementById("user-menu");
        if (!userMenu) return;
        if (userMenu.classList?.contains("visible")) {
          userMenu.classList?.replace("visible", "hidden");
        } else {
          userMenu.classList?.replace("hidden", "visible");
        }
      }}
    </script>
    <nav class="rounded-b-lg bg-gray-800 ">
      <div class="mx-auto px-2 sm:px-6 lg:px-8">
        <div class="relative flex h-16 items-center justify-between">
          <div class="absolute inset-y-0 left-0 flex items-center lg:hidden">
            <button
              type="button"
              class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onclick="toggleMobileMenu()"
            >
              <span class="absolute -inset-0.5"></span>
              <svg
                id="mobile-menu-open"
                class="block h-6 w-6"
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
                class="hidden h-6 w-6"
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
              <img
                class="h-8 w-auto "
                src="/static/crokinole.svg"
                alt="Crokinole"
              />
            </div>
            <div class="hidden lg:ml-6 lg:block">
              <div class="flex space-x-4">
                {navBarButton(
                  "Leaderboard",
                  "leaderboard",
                  activePage,
                  "/leaderboard",
                )}
                {navBarButton("Play", "play", activePage, "/play")}
                {navBarButton("Log match", "match", activePage, "/match")}
                {navBarButton("Stats", "stats", activePage)}
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
                      onclick="toggleUserMenu()"
                    >
                      <span class="absolute -inset-1.5"></span>
                      <img
                        class="h-8 w-8 rounded-full"
                        src={session.user.picture}
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
                    <a
                      href="/api/auth/signout"
                      class="block px-4 py-2 text-sm text-white"
                      role="menuitem"
                      tabindex="-1"
                    >
                      Sign out
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <AnchorButtonHtml href="/api/auth/signin/google" hx-boost="false">
                Sign In
              </AnchorButtonHtml>
            )}
          </div>
        </div>
      </div>

      <div class="hidden lg:hidden" id="mobile-menu">
        <div class="space-y-1 px-2 pb-3 pt-2">
          {navBarButton(
            "Leaderboard",
            "leaderboard",
            activePage,
            "/leaderboard",
            "block rounded-md px-3 py-2 text-base font-medium text-white",
          )}
          {navBarButton(
            "Play",
            "play",
            activePage,
            "/play",
            "block rounded-md px-3 py-2 text-base font-medium text-white",
          )}
          {navBarButton(
            "Log match",
            "match",
            activePage,
            "/match",
            "block rounded-md px-3 py-2 text-base font-medium text-white",
          )}
          {navBarButton(
            "Stats",
            "stats",
            activePage,
            "",
            "block rounded-md px-3 py-2 text-base font-medium text-white",
          )}
        </div>
      </div>
    </nav>
  </>
);

function isActivePage(page: Page, activePage: Page) {
  return page === activePage;
}

const navBarButton = (
  text: string,
  page: Page,
  activePage: Page,
  href?: string,
  classes = "rounded-md px-3 py-2 text-sm font-medium text-white",
) =>
  isActivePage(page, activePage) ? (
    <span
      class={`${classes} ${
        isActivePage(page, activePage) ? "bg-gray-900" : ""
      }`}
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
      class={`${classes} ${
        isActivePage(page, activePage) ? "bg-gray-900" : ""
      }`}
    >
      {text}
    </button>
  );
