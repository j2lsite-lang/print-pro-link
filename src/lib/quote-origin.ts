import { productUrlFor, type QuoteOrigin } from '../../supabase/functions/_shared/quote-origin';
export { productUrlFor, originSummary } from '../../supabase/functions/_shared/quote-origin';
export type { QuoteOrigin } from '../../supabase/functions/_shared/quote-origin';

const KEY = 'j2l-quote-origin';
export function saveQuoteOrigin(origin: QuoteOrigin): void {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...origin, productUrl: productUrlFor(origin.sku, origin.productUrl) })); }
  catch { /* Storage may be unavailable. */ }
}
export function readQuoteOrigin(): QuoteOrigin | null {
  try {
    const origin = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!origin || typeof origin.sku !== 'string' || typeof origin.productName !== 'string') return null;
    const productUrl = productUrlFor(origin.sku, origin.productUrl);
    return productUrl ? { ...origin, productUrl } : null;
  } catch { return null; }
}