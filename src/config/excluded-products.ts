/**
 * Centralised product exclusion & slug-redirect configuration.
 *
 * This file ONLY affects the public presentation layer (catalogue, search,
 * categories, nouveautés, recommandations, sitemaps). It NEVER deletes API
 * data, never changes prices, SKUs, the configurator, cart, quote or uploads.
 *
 * Use it to hide products that should not live in the permanent catalogue:
 * seasonal, electoral, temporary/event-only, limited editions, poorly tracked
 * items, or products likely to be removed by the supplier.
 */

/**
 * SKUs hidden everywhere on the public site.
 * The product fiche still works if reached directly (unless also unavailable),
 * but the SKU is removed from listings, search, categories, sections, sitemaps.
 */
export const EXCLUDED_SKUS: ReadonlySet<string> = new Set<string>([
  // Electoral / seasonal — supplier asked to drop the dedicated election slug
  // in favour of the standard "posters" product.
  "election-posters-fr",
]);

/**
 * Old / deprecated slugs that must 301-redirect to a real, active product.
 * Key = old slug, value = target SKU that actually exists in the live API.
 * Never redirect to an invented product.
 */
export const SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  // Supplier: stop using the electoral poster product, use the standard posters.
  "election-posters-fr": "posters",
};

/** True when a SKU must be hidden from every public listing. */
export function isExcludedSku(sku: string | undefined | null): boolean {
  if (!sku) return false;
  return EXCLUDED_SKUS.has(sku);
}

/** Returns the redirect target SKU for an old slug, or null when none. */
export function getSlugRedirect(slug: string | undefined | null): string | null {
  if (!slug) return null;
  return SLUG_REDIRECTS[slug] ?? null;
}

/**
 * A SKU is "unavailable" (show a clean "no longer available" page) when it is
 * excluded AND has no redirect target.
 */
export function isUnavailableSku(sku: string | undefined | null): boolean {
  if (!sku) return false;
  return isExcludedSku(sku) && !getSlugRedirect(sku);
}

/** Filter helper: removes excluded SKUs from any array of objects with a sku. */
export function filterExcluded<T extends { sku: string }>(items: T[]): T[] {
  return items.filter((item) => !isExcludedSku(item.sku));
}
