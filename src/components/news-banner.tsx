import { CloseIcon, InfoIcon } from "../lib/icons.tsx";

interface NewsBannerProps {
  description: string;
}

export const NewsBanner = ({ description }: NewsBannerProps) => (
  <div
    id="news-banner"
    class="relative flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-400 px-6 py-3 text-center font-semibold text-yellow-900 shadow-lg ring-1 ring-yellow-400/50"
  >
    <InfoIcon />
    <span class="text-md mx-auto mr-12 tracking-wide md:text-lg">
      {description}
    </span>
    <button
      class="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-yellow-300"
      _="on click remove #news-banner"
      aria-label="Dismiss"
      title="Dismiss"
      type="button"
    >
      <CloseIcon />
    </button>
  </div>
);
