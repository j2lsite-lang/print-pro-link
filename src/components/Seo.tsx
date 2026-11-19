import { useSEO } from "@/hooks/useSEO";

export const SITE_URL = "https://j2lprint.fr";
export const SITE_NAME = "J2L Print";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SeoProps {
  /** Page title. " | J2L Print" is appended automatically unless already present. */
  title: string;
  description: string;
  /** Absolute path beginning with "/" (e.g. "/categorie/cartes-de-visite"). */
  path: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: JsonLd;
}

/**
 * Centralised per-route head management via react-helmet-async.
 * Renders title, description, canonical, Open Graph, Twitter Cards,
 * robots and JSON-LD. Canonical and og:url always self-reference the page.
 */
export default function Seo({
  title,
  description,
  path,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const canonical = `${SITE_URL}${path}`;
  useSEO({ title, description, canonical, ogType, ogImage, noindex, jsonLd });
  return null;
}
