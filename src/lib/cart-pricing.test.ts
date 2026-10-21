import { it, expect } from "vitest";
import { currentCartPrice } from "./cart-pricing";

it("recalculates from raw cost, never from the old selling price", () => {
  expect(currentCartPrice({ supplierPriceHT: 100, unitPrice: 130 })).toBe(180);
  expect(currentCartPrice({ supplierPriceHT: 100, unitPrice: 245, includeDesignFee: true })).toBe(245);
});
it("keeps old resale-only lines but removes their unverified estimates", () => {
  expect(currentCartPrice({ unitPrice: 130 })).toBeNull();
});