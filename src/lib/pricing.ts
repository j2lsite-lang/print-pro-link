/**
 * Pricing configuration for J2L Print
 * 
 * MARGIN_COEFFICIENT: multiplier applied to the supplier price (salesPrice)
 * to calculate the resale price for the customer.
 * Example: 2.0 means the customer pays 2x the supplier cost.
 */
export const MARGIN_COEFFICIENT = 2.0;

/**
 * Design/mockup fees (conception de maquette)
 * Starting price in EUR HT
 */
export const DESIGN_FEE_BASE = 65;

/**
 * Round a price up to the nearest 0.10 € for clean display
 * e.g. 46.83 → 46.90, 93.51 → 93.60
 */
function roundUp10(value: number): number {
  return Math.ceil(value * 10) / 10;
}

/**
 * Extract the supplier price from a Print.com price result
 */
export function getSupplierPrice(priceResult: any): number {
  return priceResult?.prices?.salesPrice ?? priceResult?.price ?? priceResult?.totalPrice ?? 0;
}

/**
 * Calculate the resale price (customer-facing) from a price result
 * Rounded up to nearest 0.10 € for clean display
 */
export function getResalePrice(priceResult: any): number {
  const supplier = getSupplierPrice(priceResult);
  return roundUp10(supplier * MARGIN_COEFFICIENT);
}

/**
 * Get the number of copies from a price result
 */
export function getCopies(priceResult: any): number {
  return priceResult?.options?.copies ?? 1;
}

/**
 * Calculate per-unit resale price
 */
export function getUnitResalePrice(priceResult: any): number {
  const total = getResalePrice(priceResult);
  const copies = getCopies(priceResult);
  return copies > 1 ? Math.ceil((total / copies) * 10000) / 10000 : total;
}