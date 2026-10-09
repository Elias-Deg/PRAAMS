import Link from "next/link";

/** Accessibility: skip repeated navigation, jump straight to main content. */
export function SkipLink(): React.ReactElement {
  return (
    <Link
      href="#main-content"
      className="sr-only z-50 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-bold text-white shadow-pop focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      Skip to main content
    </Link>
  );
}
