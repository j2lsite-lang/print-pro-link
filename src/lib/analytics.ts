// Google Analytics 4 — single tag, single page_view per navigation.
const MEASUREMENT_ID =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined) ||
  "G-5LKVKFMSJR";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __gaInitialized?: boolean;
  }
}

export const gaMeasurementId = MEASUREMENT_ID;

// GA requires the raw `arguments` object to be pushed, not a plain array.
export const gtag = function () {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
} as (...args: unknown[]) => void;

export function initAnalytics() {
  if (typeof window === "undefined" || !MEASUREMENT_ID) return;
  // Guard against double initialisation (HMR, double mount, duplicate tag)
  if (window.__gaInitialized) return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    window.__gaInitialized = true;
    return;
  }
  window.__gaInitialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  gtag("js", new Date());
  // GA4 sends the initial page_view and, via enhanced measurement, one page_view
  // per browser-history change (SPA navigation). We therefore do NOT send any
  // manual page_view for history navigations, to avoid duplicates.
  gtag("config", MEASUREMENT_ID);
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !MEASUREMENT_ID) return;
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    send_to: MEASUREMENT_ID,
  });
}
