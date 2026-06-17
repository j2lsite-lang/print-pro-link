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

export interface HeroCta {
  label: string;
  path: string;
  /** "primary" = filled accent button, "secondary" = outlined */
  variant?: "primary" | "secondary";
}

export interface SeoHero {
  /** absolute public path, e.g. "/seo/hero-print-1.jpg" */
  image: string;
  imageAlt: string;
  /** small uppercase label above the H1 */
  eyebrow?: string;
  /** local accroche shown under the H1 */
  tagline: string;
  ctas: HeroCta[];
}

export interface ProductCard {
  /** rendered as an H3 */
  label: string;
  path: string;
  /** lucide-react icon name (mapped at runtime) */
  icon: string;
  description: string;
}

export interface ProductGrid {
  /** rendered as an H2 */
  heading: string;
  intro?: string;
  cards: ProductCard[];
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
  /** Optional external links to official/useful resources (max 1-2 per page). */
  externalLinks?: LinkItem[];
  faq?: FaqItem[];
  /** Optional visual hero banner (city/department pages). */
  hero?: SeoHero;
  /** Optional product-cards grid linking to existing catalog categories. */
  productGrid?: ProductGrid;
  /** JSON-LD blocks already shaped for schema.org */
  jsonLd: Record<string, unknown>[];
  noindex?: boolean;
  ogType?: string;
  /**
   * Natural Google search expressions ("requêtes") matching this page.
   * Pure SEO metadata used by generated pages — never affects URLs, prices,
   * SKUs or the configurator.
   */
  keywords?: string[];
}
