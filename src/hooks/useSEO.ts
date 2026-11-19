import { useEffect } from "react";
import { uniqueHeadElement } from "@/lib/seo-head";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
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
export function useSEO({ title, description, canonical, ogTitle, ogDescription, ogType, ogImage, noindex = false, jsonLd }: SEOProps) {
  useEffect(() => {
    // Title
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Meta description
    const metaDesc = uniqueHeadElement('meta[name="description"]', () => {
      const el = document.createElement("meta");
      el.name = "description";
      return el;
    });
    metaDesc.setAttribute("content", description);

    // Canonical
    const canonicalUrl = canonical || `${BASE_URL}${window.location.pathname}`;
    const link = uniqueHeadElement('link[rel="canonical"]', () => {
      const el = document.createElement("link");
      el.rel = "canonical";
      return el;
    });
    link.href = canonicalUrl;

    // OG tags
    const setMeta = (property: string, content: string) => {
      const el = uniqueHeadElement(`meta[property="${property}"]`, () => {
        const el = document.createElement("meta");
        el.setAttribute("property", property);
        return el;
      });
      el.setAttribute("content", content);
    };

    const setNamedMeta = (name: string, content: string) => {
      const el = uniqueHeadElement(`meta[name="${name}"]`, () => {
        const el = document.createElement("meta");
        el.setAttribute("name", name);
        return el;
      });
      el.setAttribute("content", content);
    };

    setMeta("og:title", ogTitle || fullTitle);
    setMeta("og:description", ogDescription || description);
    setMeta("og:url", canonicalUrl);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("og:site_name", SITE_NAME);
    setMeta("og:locale", "fr_FR");
    setMeta("og:type", ogType || "website");
    setNamedMeta("robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setNamedMeta("twitter:card", "summary_large_image");

    setNamedMeta("twitter:title", ogTitle || fullTitle);
    setNamedMeta("twitter:description", ogDescription || description);
    setNamedMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // JSON-LD (page-specific)
    document.querySelectorAll('script[data-prerendered-ldjson]').forEach((el) => el.remove());
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
      const existing = document.getElementById(JSON_LD_ID);
      if (existing) existing.remove();
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogType, ogImage, noindex, jsonLd]);
}
