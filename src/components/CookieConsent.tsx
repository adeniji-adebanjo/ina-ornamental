"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  OPEN_SETTINGS,
  openConsentSettings,
  setConsent,
  useConsent,
} from "@/lib/consent";
import { ANALYTICS_ENABLED, isAnalyticsExcludedPath } from "@/components/GoogleAnalytics";

/**
 * Analytics consent banner. Shown only where analytics could actually run
 * (production, GA configured, public pages) and only until the visitor
 * chooses. The footer's "Cookie settings" link re-opens it.
 */
export default function CookieConsent() {
  const consent = useConsent();
  const pathname = usePathname();
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_SETTINGS, open);
    return () => window.removeEventListener(OPEN_SETTINGS, open);
  }, []);

  if (!ANALYTICS_ENABLED) return null;
  if (!pathname || isAnalyticsExcludedPath(pathname)) return null;
  if (consent === undefined) return null; // not hydrated yet
  if (consent !== null && !reopened) return null;

  const choose = (value: "granted" | "denied") => {
    setConsent(value);
    setReopened(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-text"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 id="cookie-consent-title" className="font-semibold text-slate-900">
          Help us improve our website
        </h2>
        <p id="cookie-consent-text" className="mt-1 text-sm text-slate-600">
          With your permission we use Google Analytics cookies to understand how
          visitors use the site. We don&apos;t use them for advertising, and the
          site works the same either way.
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => choose("denied")}
          >
            No thanks
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => choose("granted")}
          >
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Footer link that re-opens the banner. Renders nothing if analytics is off. */
export function CookieSettingsLink() {
  if (!ANALYTICS_ENABLED) return null;
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className="text-xs text-slate-500 hover:text-emerald-400 underline-offset-2 hover:underline"
    >
      Cookie settings
    </button>
  );
}
