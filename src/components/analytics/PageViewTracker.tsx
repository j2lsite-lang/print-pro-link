import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Sends exactly one GA4 page_view per navigation (including the first load).
 */
const PageViewTracker = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (lastPath.current === path) return;
    lastPath.current = path;
    // Let the route render so document.title is up to date
    const id = window.setTimeout(() => trackPageView(path), 60);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
};

export default PageViewTracker;
