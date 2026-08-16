import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gaMeasurementId, trackPageView } from "@/lib/analytics";

/**
 * Safety net for GA4 SPA tracking.
 *
 * GA4 already sends:
 *  - one page_view on the initial load (gtag config)
 *  - one page_view per browser-history change (enhanced measurement)
 *
 * This component therefore sends nothing when enhanced measurement is active;
 * it only fires a manual page_view if GA has not recorded any hit for the new
 * path after a short delay (i.e. enhanced measurement disabled in GA4).
 */
const PageViewTracker = () => {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (!gaMeasurementId) return;
    if (first.current) {
      first.current = false; // initial page_view handled by gtag config
      return;
    }
    const path = `${location.pathname}${location.search}`;
    const timer = window.setTimeout(() => {
      const dl = (window.dataLayer || []) as unknown[];
      const alreadySent = dl.some((entry) => {
        const args = Array.from(entry as ArrayLike<unknown>);
        return args[0] === "event" && args[1] === "page_view";
      });
      // GA's own history listener records the view; only fall back if silent.
      if (!alreadySent && window.location.pathname + window.location.search === path) {
        trackPageView(path);
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
};

export default PageViewTracker;
