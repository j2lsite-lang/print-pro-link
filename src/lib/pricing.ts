/**
 * Pricing configuration for J2L Print
 * Adapted for Print.com API
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
 * Extract the supplier price from a Print.com price result
 * Print.com returns { price: { ..., totalPrice: N }, ... }
 */
export function getSupplierPrice(priceResult: any): number {
  if (!priceResult) return 0;

  // Print.com legacy/other formats
  if (priceResult.price?.totalPrice != null) return Number(priceResult.price.totalPrice) || 0;
  if (priceResult.totalPrice != null) return Number(priceResult.totalPrice) || 0;

  // Print.com product price response format
  if (priceResult.prices?.salesPrice != null) return Number(priceResult.prices.salesPrice) || 0;
  if (priceResult.prices?.productPrice != null) return Number(priceResult.prices.productPrice) || 0;
  if (priceResult.prices?.normalPrice != null) return Number(priceResult.prices.normalPrice) || 0;

  // Fallback: direct number
  if (typeof priceResult.price === "number") return priceResult.price;
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
 * Get the number of copies from the price result
 */
export function getCopies(priceResult: any, quantity?: number): number {
  if (priceResult?.copies) return priceResult.copies;
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
