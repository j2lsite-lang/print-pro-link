/**
 * Pricing configuration for J2L Print
 * Adapted for Realisaprint API
 *
 * MARGIN_COEFFICIENT: multiplier applied to the supplier price
 * to calculate the resale price for the customer.
 */
export const MARGIN_COEFFICIENT = 2.0;

/**
 * Design/mockup fees (conception de maquette)
 * Starting price in EUR HT
 */
export const DESIGN_FEE_BASE = 65;

/**
 * Round a price up to the nearest 0.10 € for clean display
 */
function roundUp10(value: number): number {
  return Math.ceil(value * 10) / 10;
}

/**
 * Extract the supplier price from a Realisaprint price result
 * Realisaprint returns { price: "33.00", ... }
 */
export function getSupplierPrice(priceResult: any): number {
  if (!priceResult) return 0;
  return parseFloat(priceResult.price) || 0;
}

/**
 * Calculate the resale price (customer-facing)
 */
export function getResalePrice(priceResult: any): number {
  const supplier = getSupplierPrice(priceResult);
  return roundUp10(supplier * MARGIN_COEFFICIENT);
}

/**
 * Get the number of copies from context (not in price result for Realisaprint)
 */
export function getCopies(priceResult: any, quantity?: number): number {
  return quantity || 1;
}

/**
 * Calculate per-unit resale price
 */
export function getUnitResalePrice(priceResult: any, quantity?: number): number {
  const total = getResalePrice(priceResult);
  const copies = getCopies(priceResult, quantity);
  return copies > 1 ? Math.ceil((total / copies) * 10000) / 10000 : total;
}
