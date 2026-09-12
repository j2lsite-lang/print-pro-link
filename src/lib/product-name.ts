/**
 * Single source of truth for the DISPLAYED name of a catalog product.
 *
 * Used by BOTH the build-time prerenderer (scripts/seo) and the runtime React
 * app (catalog lists, fiche produit) so the visitor and Googlebot always read
 * exactly the same product name — no divergence.
 *
 * Rules (no invented content):
 *  1. A factual French override from TWIN_PRODUCT_NAMES wins (supplier labels
 *     left in English or ambiguous twin SKUs).
 *  2. When the supplier title carries an outdated year (e.g. "Agenda 2026" in
 *     2026 or later) and the catalog CMS provides a year-neutral product name,
 *     the CMS name is used — it is the current catalog data.
 *  3. Otherwise the supplier title is used as-is.
 *
 * Never affects SKUs, prices, the configurator, the cart, quotes or URLs.
 */
import { TWIN_PRODUCT_NAMES } from "../seo/data/twin-products";

const clean = (s?: string | null) => (s || "").replace(/\s+/g, " ").trim();

export function displayProductName(
  sku: string,
  apiName?: string | null,
  cmsName?: string | null,
): string {
  const override = clean(TWIN_PRODUCT_NAMES[sku]);
  if (override) return override;

  const api = clean(apiName);
  const cms = clean(cmsName);

  const year = api.match(/\b(20\d{2})\b/);
  if (year && Number(year[1]) <= new Date().getFullYear() && cms) return cms;

  return api || cms || sku;
}
