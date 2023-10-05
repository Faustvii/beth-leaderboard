import { type PropsWithChildren } from "@kitajs/html";
import { type Session } from "lucia";
import { AnchorButtonHtml } from "./Button";

interface PropsWithSession extends PropsWithChildren {
  session: Session | null;
}

export const NavbarHtml = ({ session, children }: PropsWithSession) => (
  <>
    <nav class="border-gray-200 bg-white dark:bg-gray-900">
      <div class="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
        <div class="flex flex-1 justify-between">
          <a
            href="/"
            class="collapse whitespace-nowrap px-4 text-2xl font-semibold dark:text-white lg:visible"
          >
            Crock it
          </a>
          <div class="">
            {session ? (
              <>
                <AnchorButtonHtml href={`/play`} text="Match make" />
                <AnchorButtonHtml
                  hxGet={`/leaderboard/page/${2}`}
                  hxTarget="#mainContainer"
                  text="Log Match"
                />
                <AnchorButtonHtml href="/api/auth/signout" text="Sign Out" />
              </>
            ) : (
              <a
                href="/api/auth/signin/google"
                hx-indicator=".progress-bar"
                hx-boost="false"
                class="rounded-lg bg-blue-500 px-2 py-2 text-white transition duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
    {children}
  </>
);
