// Shared SEO page model — single source of truth consumed by both the
// build-time prerenderer (scripts/) and the runtime React routes (src/).

export interface BreadcrumbItem {
  name: string;
  /** absolute path beginning with "/" */
  path: string;
}

export interface LinkItem {
  label: string;
  path: string;
  /** external links get target/rel handling */
  external?: boolean;
}

export interface LinkGroup {
  heading: string;
  links: LinkItem[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ContentSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface SeoPage {
  /** canonical path, e.g. "/categorie/impression-papier" */
  path: string;
  title: string;
  description: string;
  h1: string;
  /** main introduction (1-3 paragraphs) */
  intro: string[];
  breadcrumb: BreadcrumbItem[];
  sections?: ContentSection[];
  /**
   * Optional call-to-action button toward the existing Print.com catalog.
   * SEO pages never fetch or embed the catalog themselves — they only link to it.
   */
  cta?: { label: string; path: string };
  internalLinks?: LinkGroup[];
  faq?: FaqItem[];
  /** JSON-LD blocks already shaped for schema.org */
  jsonLd: Record<string, unknown>[];
  noindex?: boolean;
  ogType?: string;
}
