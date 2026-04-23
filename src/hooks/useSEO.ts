import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const BASE_URL = "https://j2lprint.fr";
const SITE_NAME = "J2L Print";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

const JSON_LD_ID = "page-json-ld";

/**
 * Dynamically update document head for SEO:
 * - <title>
 * - <meta name="description">
 * - <link rel="canonical">
 * - Open Graph tags
 * - Optional JSON-LD structured data
 */
export function useSEO({ title, description, canonical, ogTitle, ogDescription, ogType, ogImage, jsonLd }: SEOProps) {
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

    const setNamedMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (el) {
        el.setAttribute("content", content);
      } else {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        el.setAttribute("content", content);
        document.head.appendChild(el);
      }
    };

    setMeta("og:title", ogTitle || fullTitle);
    setMeta("og:description", ogDescription || description);
    setMeta("og:url", canonicalUrl);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("og:site_name", SITE_NAME);
    setMeta("og:locale", "fr_FR");
    if (ogType) setMeta("og:type", ogType);

    setNamedMeta("twitter:title", ogTitle || fullTitle);
    setNamedMeta("twitter:description", ogDescription || description);
    setNamedMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // JSON-LD (page-specific)
    let jsonLdEl = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!jsonLdEl) {
        jsonLdEl = document.createElement("script");
        jsonLdEl.type = "application/ld+json";
        jsonLdEl.id = JSON_LD_ID;
        document.head.appendChild(jsonLdEl);
      }
      jsonLdEl.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdEl) {
      jsonLdEl.remove();
    }

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = `${SITE_NAME} – Imprimerie en ligne | Impression & supports publicitaires`;
      if (metaDesc) metaDesc.setAttribute("content", "J2L Print, votre imprimerie en ligne. Impression numérique, flyers, cartes de visite, affiches, bâches, adhésifs, objets publicitaires. Devis gratuit, nous livrons partout.");
      if (link) link.href = `${BASE_URL}/`;
      const existing = document.getElementById(JSON_LD_ID);
      if (existing) existing.remove();
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogType, ogImage, jsonLd]);
}
