import { describe, expect, it } from "vitest";
import { supplierQuantities, isSupplierExcluded } from "./supplier-quantities";

describe("supplier-only quantities", () => {
  it("uses calendar explicit options instead of inconsistent 1 and 25 summaries", () => {
    const property = { slug: "copies", options: [10, 20, 30, 40, 50, 75, 100, 250, 500].map(slug => ({ slug, type: "digital" })),
      rangeSets: [{ printingmethod: "digital", summary: [1, 10, 25], options: [{ min: 1, max: 1500, steps: 1 }] }] };
    expect(supplierQuantities(property, { printingmethod: "digital" })).toEqual([10, 20, 30, 40, 50, 75, 100, 250, 500]);
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
  });
  it("never invents a one-copy fallback when data is missing or malformed", () => {
    expect(supplierQuantities(undefined, {})).toEqual([]);
    expect(supplierQuantities({ slug: "copies", optionsInSummary: [1, 10] }, {})).toEqual([]);
    expect(supplierQuantities({ slug: "copies", rangeSets: [{ options: [{ min: 0, max: 10, steps: 0 }] }] }, {})).toEqual([]);
  });
});