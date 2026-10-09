import Link from "next/link";

/** Branded 404 (brief §12: clear states with a next action). */
export default function NotFound(): React.ReactElement {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 text-sm text-gray-600">
        The page you requested does not exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Back to dashboard
      </Link>
    </main>
  );
}


