"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import "./globals.css";

// Replaces the root layout when it errors, so it must render its own
// <html>/<body> and can't rely on the layout's fonts, header or providers.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans antialiased">
        <title>Something went wrong | INÁ Ornamental Fish</title>
        <main className="max-w-lg w-full rounded-2xl bg-white p-8 md:p-12 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
            INÁ Ornamental Fish
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-500">
            We hit an unexpected problem loading the site. Please try again in a
            moment.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-slate-400">
              Reference: <span className="font-mono">{error.digest}</span>
            </p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-800 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              Try again
            </button>
            {/* A full page load is intentional: the root layout is broken. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
