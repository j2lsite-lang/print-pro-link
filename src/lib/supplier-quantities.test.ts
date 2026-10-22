import { describe, expect, it } from "vitest";
import { supplierQuantities, isSupplierExcluded } from "./supplier-quantities";

describe("supplier-only quantities", () => {
  it("respects the calendar range confirmed by supplier pricing, not just suggested options", () => {
    const property = { slug: "copies", options: [10, 20, 30, 40, 50, 75, 100, 250, 500].map(slug => ({ slug, type: "digital" })),
      rangeSets: [{ printingmethod: "digital", summary: [1, 10, 25], options: [{ min: 1, max: 1500, steps: 1 }] }] };
    const allowed = supplierQuantities(property, { printingmethod: "digital" });
    expect(allowed).toHaveLength(1500);
    expect(allowed).toContain(1);
    expect(allowed).toContain(25);
    expect(allowed).not.toContain(1501);
  });
  it("respects real minimums, steps and method changes across all range segments", () => {
    const property = { slug: "copies", rangeSets: [{ printingmethod: "offset", summary: [1, 25], options: [{ min: 500, max: 1500, steps: 500 }, { min: 4000, max: 5000, steps: 1000 }] },
      { printingmethod: "digital", options: [{ min: 10, max: 30, steps: 10 }] }] };
    expect(supplierQuantities(property, { printingmethod: "offset" })).toEqual([500, 1000, 1500, 4000, 5000]);
    expect(supplierQuantities(property, { printingmethod: "digital" })).toEqual([10, 20, 30]);
    expect(supplierQuantities(property, { printingmethod: "unknown" })).toEqual([]);
  });
  it("normalizes numeric exclusions and refreshes by format and material", () => {
    const property = { slug: "copies", options: [10, 20, 30].map(slug => ({ slug })) };
    const excludes = [[{ property: "copies", options: [10] }, { property: "material", options: ["thick"] }]];
    expect(supplierQuantities(property, { material: "thick" }, excludes)).toEqual([20, 30]);
    expect(supplierQuantities(property, { material: "thin" }, excludes)).toEqual([10, 20, 30]);
    expect(isSupplierExcluded({ copies: "10", material: "thick" }, excludes)).toBe(true);
    expect(supplierQuantities(property, { material: "thick" }, [[{ property: "material", options: ["thick"] }]])).toEqual([10, 20, 30]);
  });
  it("never invents a one-copy fallback when data is missing or malformed", () => {
    expect(supplierQuantities(undefined, {})).toEqual([]);
    expect(supplierQuantities({ slug: "copies", optionsInSummary: [1, 10] }, {})).toEqual([]);
    expect(supplierQuantities({ slug: "copies", rangeSets: [{ options: [{ min: 0, max: 10, steps: 0 }] }] }, {})).toEqual([]);
  });
});
import { nextSuggestedQuantity } from "./supplier-quantities";
describe("nextSuggestedQuantity", () => {
  it("skips to the first supplier-suggested quantity above an untariffed one", () => {
    const prop = { slug: "copies", options: [{ slug: 25 }, { slug: 50 }], rangeSets: [{ printingmethod: "digital", summary: [25, 50, 100], options: [{ min: 1, max: 15001, steps: 1 }] }] };
    expect(nextSuggestedQuantity(prop, { printingmethod: "digital" }, [], 1)).toBe(25);
    expect(nextSuggestedQuantity(prop, { printingmethod: "digital" }, [], 50)).toBe(100);
    expect(nextSuggestedQuantity(prop, { printingmethod: "digital" }, [], 100)).toBeNull();
  });
});
