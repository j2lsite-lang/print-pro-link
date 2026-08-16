import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gaMeasurementId, trackPageView } from "@/lib/analytics";

/**
 * GA4 SPA page_view control.
 *
 * gtag.js already sends:
 *  - one page_view on the initial load (gtag "config")
 *  - one page_view per browser-history change (GA4 enhanced measurement)
 *
 * To guarantee exactly ONE page_view per navigation, this component sends a
 * manual page_view only when GA's own history listener is unavailable
 * (enhanced measurement disabled), detected by patching history.pushState.
 */
const ENHANCED = "__gaEnhancedHistory";

const PageViewTracker = () => {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (!gaMeasurementId) return;
    if (first.current) {
      first.current = false; // initial page_view handled by gtag config
      return;
    }
    const w = window as unknown as Record<string, unknown>;
    // gtag.js wraps history.pushState when enhanced measurement is enabled.
    const enhanced =
      w[ENHANCED] ??
      (w[ENHANCED] = !/\[native code\]/.test(String(window.history.pushState)));
    if (enhanced) return; // GA already sends the page_view for this navigation

    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
};

export default PageViewTracker;
