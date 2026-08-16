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

/** Envoi d'un événement GA4 unique (aucun doublon : un seul tag configuré). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !MEASUREMENT_ID) return;
  gtag("event", name, { ...params, send_to: MEASUREMENT_ID });
}

/**
 * Conversion « demande de devis ». À n'appeler QU'APRÈS confirmation réelle
 * de l'envoi du formulaire (réponse serveur OK), jamais à l'ouverture ni au
 * simple clic sur le bouton.
 */
export function trackGenerateLead(formName: string, params: Record<string, unknown> = {}) {
  trackEvent("generate_lead", { form_name: formName, ...params });
}

/**
 * Clics de contact (téléphone / e-mail) : un seul écouteur délégué pour tout
 * le site, donc aucun double comptage même si le lien apparaît plusieurs fois.
 */
export function initContactClickTracking() {
  if (typeof window === "undefined" || !MEASUREMENT_ID) return;
  const w = window as unknown as Record<string, unknown>;
  if (w.__gaContactClicks) return;
  w.__gaContactClicks = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.("a[href^='tel:'], a[href^='mailto:']") as
        | HTMLAnchorElement
        | null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("tel:")) {
        trackEvent("phone_click", { phone_number: href.slice(4), link_url: href });
      } else if (href.startsWith("mailto:")) {
        trackEvent("email_click", { email_address: href.slice(7), link_url: href });
      }
    },
    { capture: true },
  );
}
