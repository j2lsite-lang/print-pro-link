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

export interface ProductItem {
  /** real Print.com SKU — links to the live configurator at /products/{sku} */
  sku: string;
  name: string;
  /** real catalog thumbnail (CMS), never a placeholder/fake */
  image?: string | null;
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
  /** real catalog products shown on the page (e.g. a subcategory listing) */
  products?: ProductItem[];
  /** heading shown above the products grid */
  productsHeading?: string;
  internalLinks?: LinkGroup[];
  faq?: FaqItem[];
  /** JSON-LD blocks already shaped for schema.org */
  jsonLd: Record<string, unknown>[];
  noindex?: boolean;
  ogType?: string;
}
