import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
}

const BASE_URL = "https://j2lprint.fr";
const SITE_NAME = "J2L Print";

/**
 * Dynamically update document head for SEO:
 * - <title>
 * - <meta name="description">
 * - <link rel="canonical">
 * - Open Graph tags
 */
export function useSEO({ title, description, canonical, ogTitle, ogDescription, ogType }: SEOProps) {
  useEffect(() => {
    // Title
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);

    // Canonical
    const canonicalUrl = canonical || `${BASE_URL}${window.location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (link) {
      link.href = canonicalUrl;
    } else {
      link = document.createElement("link");
      link.rel = "canonical";
      link.href = canonicalUrl;
      document.head.appendChild(link);
    }

    // OG tags
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (el) {
        el.setAttribute("content", content);
      } else {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        el.setAttribute("content", content);
        document.head.appendChild(el);
      }
    };

    setMeta("og:title", ogTitle || fullTitle);
    setMeta("og:description", ogDescription || description);
    setMeta("og:url", canonicalUrl);
    if (ogType) setMeta("og:type", ogType);

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = `${SITE_NAME} – Imprimerie en ligne | Impression & supports publicitaires`;
      if (metaDesc) metaDesc.setAttribute("content", "J2L Print, votre imprimerie en ligne. Impression numérique, flyers, cartes de visite, affiches, bâches, adhésifs, objets publicitaires. Devis gratuit, nous livrons partout.");
      if (link) link.href = `${BASE_URL}/`;
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogType]);
}
