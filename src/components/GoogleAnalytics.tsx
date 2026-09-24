import Script from "next/script";

// GA4 measurement ID. Public by design — it ships in the page source — but kept
// overridable so a staging deploy can report to a separate property.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-Q9W206X5JK";

/**
 * Google tag (gtag.js) for GA4.
 *
 * `afterInteractive` is the right strategy for analytics: the tag loads early
 * but after hydration, so it never competes with the page's own JavaScript.
 * An inline <Script> must carry an `id` — Next uses it to guarantee the snippet
 * runs exactly once rather than re-executing on client-side navigations.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

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
