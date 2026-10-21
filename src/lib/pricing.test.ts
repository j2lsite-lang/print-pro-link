import { describe, it, expect } from "vitest";
import { getResalePrice, resaleFromSupplierHT, hasSupplierPrice, MARGIN_COEFFICIENT } from "./pricing";

describe("supplier-only resale HT", () => {
  it("applies x1.8 once to the purchase price", () => {
    expect(MARGIN_COEFFICIENT).toBe(1.8);
    expect(getResalePrice({ price: { totalPrice: 100 } })).toBe(180);
  });
  it("rounds upwards to the next ten cents without rounding exact multiples again", () => {
    expect(resaleFromSupplierHT(32.07)).toBe(57.8);
    expect(resaleFromSupplierHT(26.29)).toBe(47.4);
    expect(resaleFromSupplierHT(9.05)).toBe(16.3);
    expect(resaleFromSupplierHT(52.1)).toBe(93.8);
    expect(resaleFromSupplierHT(213.32)).toBe(384);
    expect(resaleFromSupplierHT(227.46)).toBe(409.5);
    expect(resaleFromSupplierHT(42.65)).toBe(76.8);
    expect(resaleFromSupplierHT(10)).toBe(18);
  });
  it("rejects missing, zero, negative and nonfinite supplier prices", () => {
    for (const value of [null, {}, { price: 0 }, { price: -10 }, { price: Infinity }, { price: "invalid" }]) {
      expect(hasSupplierPrice(value)).toBe(false);
      expect(getResalePrice(value)).toBe(0);
    }
  });
});