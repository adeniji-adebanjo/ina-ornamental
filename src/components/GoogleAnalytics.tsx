"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

// GA4 measurement ID — must be supplied via env; nothing loads without it, so
// dev/staging builds never report into the production property by accident.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
const ENABLED =
  process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);

// Private / authenticated areas are never tracked.
const EXCLUDED_PREFIXES = ["/admin", "/login", "/orders"];

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Google tag (gtag.js) for GA4 — production only, public pages only.
 *
 * The tag is never injected on an excluded path. Because gtag stays in the
 * document once loaded, a client-side navigation from a public page into an
 * excluded one also flips GA's official per-property opt-out flag
 * (`window['ga-disable-<ID>']`) so no page views are recorded there.
 *
 * `afterInteractive` loads the tag after hydration; the inline <Script> carries
 * an `id` so Next runs it exactly once.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const excluded = !pathname || isExcluded(pathname);

  useEffect(() => {
    if (!ENABLED) return;
    (window as unknown as Record<string, unknown>)[
      `ga-disable-${GA_MEASUREMENT_ID}`
    ] = excluded;
  }, [excluded]);

  if (!ENABLED || excluded) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
