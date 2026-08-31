import Link from "next/link";

/** Branded 404 (brief §12: clear states with a next action). */
export default function NotFound(): React.ReactElement {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">404</p>
      <h1 className="mt-2 text-2xl font-bold text-navy">Page not found</h1>
      <p className="mt-3 text-sm text-gray-600">
        The page you requested does not exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-sm bg-navy px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
