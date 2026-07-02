// schema.org JSON-LD builders. Only emit real, stable data — never fake
// prices, ratings, reviews, stock or delivery promises.
import { SITE_URL, SITE_NAME } from "./render";
import type { BreadcrumbItem, FaqItem } from "./types";

export const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  legalName: "J2L Publicité",
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.jpg`,
  areaServed: "FR",
  description:
    "Imprimerie en ligne : impression professionnelle et supports de communication livrés partout en France.",
};

export function breadcrumbLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function collectionPageLd(opts: {
  name: string;
  description: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: `${SITE_URL}${it.path}`,
      })),
    },
  };
}

export function serviceLd(opts: {
  name: string;
  description: string;
  areaServed: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Impression et supports de communication",
    name: opts.name,
    description: opts.description,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: { "@type": "Place", name: opts.areaServed },
  };
}

export function webPageLd(opts: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}

export function faqLd(faq: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function productLd(opts: {
  name: string;
  description: string;
  sku: string;
  path: string;
  image?: string | null;
  /** Real "starting from" price computed from the default configuration. */
  fromPrice?: number | null;
}) {
  const ld: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    sku: opts.sku,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    brand: { "@type": "Brand", name: SITE_NAME },
  };
  if (opts.image) ld.image = opts.image;
  // Real `Offer` built from the exact HT price the configurator shows for the
  // product's DEFAULT configuration. Never invented, never a rating/review.
  if (opts.fromPrice && opts.fromPrice > 0) {
    ld.offers = {
      "@type": "Offer",
      price: Number(opts.fromPrice.toFixed(2)),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}${opts.path}`,
      seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    };
  }
  return ld;
}
