export const SITE_ORIGIN = 'https://j2lprint.fr';

export interface QuoteOrigin {
  sku: string;
  productName: string;
  productUrl: string;
  quantity?: number | string;
  copies?: number | string;
  options?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
}

// Only real product paths are accepted, never the quote form or an external URL.
export function productUrlFor(sku?: string | null, explicit?: string | null): string {
  if (explicit) {
    try {
      const url = new URL(explicit, SITE_ORIGIN);
      if (url.origin === SITE_ORIGIN && /^\/products\/[a-z0-9._-]+\/?$/i.test(url.pathname)) {
        return url.href;
      }
    } catch { /* Use supplier reference instead. */ }
  }
  return sku && /^[a-z0-9][a-z0-9._-]*$/i.test(sku)
    ? `${SITE_ORIGIN}/products/${sku}` : '';
}

export function originSummary(origin: QuoteOrigin | null): string {
  if (!origin) return '';
  return [
    `Produit : ${origin.productName}`,
    `Référence fournisseur : ${origin.sku}`,
    `Fiche produit : ${productUrlFor(origin.sku, origin.productUrl)}`,
    origin.quantity != null ? `Lots : ${origin.quantity}` : '',
    origin.copies != null ? `Exemplaires : ${origin.copies}` : '',
    ...Object.entries(origin.options || {}).map(([k, v]) => `${k} : ${String(v)}`),
    origin.configuration ? `Configuration fournisseur : ${JSON.stringify(origin.configuration)}` : '',
  ].filter(Boolean).join('\n');
}