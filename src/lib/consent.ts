"use client";

// Analytics consent, shared by the banner, the footer "Cookie settings" link
// and the GA loader. Google Analytics is not loaded at all until the visitor
// accepts (no cookies, no requests), which keeps the site on the safe side of
// GDPR / ePrivacy for EU buyers without needing Consent Mode modelling.
import { useSyncExternalStore } from "react";

export type Consent = "granted" | "denied" | null;

const KEY = "ina-analytics-consent-v1";
const CHANGE = "ina-consent-change";
export const OPEN_SETTINGS = "ina-consent-open";

function read(): Consent {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null; // storage blocked: treat as undecided, never as granted
  }
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* storage blocked — the choice holds for this page view only */
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Re-open the banner so the visitor can change their choice. */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Current consent. `undefined` during server render and hydration, so nothing
 * consent-dependent renders until the browser's stored choice is known (no
 * hydration mismatch, no flash of the banner for visitors who already chose).
 */
export function useConsent(): Consent | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
