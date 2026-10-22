import { describe, it, expect, vi } from "vitest";
import { calculateShipping, shippingChoices, quoteTotals } from "../../supabase/functions/_shared/shipping";
import { resaleFromSupplierHT } from "./pricing";
const line = { sku: "bureau-calendar", quantity: 1, copies: 1, configuration: { copies: 1, size: "a5_landscape_tipi", urgency: "standard" } };
const address = { country: "FR", postalCode: "75001", city: "Paris" };
const response = { results: [{ possibilities: [
  { method: "UPS_STANDARD", carrier: "UPS", price: { base: 9.14, cost: 9.14, urgency: 0 } },
  { method: "UPS_SAVER", carrier: "UPS", price: { base: 13.29, cost: 13.29, urgency: 0 } },
  { method: "UPS_STANDARD", carrier: "UPS", price: { base: 9.14, cost: 9.14, urgency: 0 } },
] }] };
describe("real supplier shipping", () => {
  it("calendar: purchase 31.25 gives products 56.30, transport 9.14 unchanged, HT 65.44, VAT 13.09, TTC 78.53", () => {
    expect(resaleFromSupplierHT(31.25)).toBe(56.3);
    expect(quoteTotals(resaleFromSupplierHT(31.25), 9.14)).toMatchObject({ estimatedTotalHt: 65.44, vatAmount: 13.09, estimatedTotalTtc: 78.53 });
  });
  it("never adds base to cost or counts dated possibilities multiple times", () => {
    expect(shippingChoices(response)).toHaveLength(2);
    expect(shippingChoices(response)[0].cost).toBe(9.14);
  });
  it("uses the requested real mode without transport markup", async () => {
    const call = vi.fn().mockResolvedValue({ ok: true, data: response });
    const result = await calculateShipping([line], address, call, "UPS_SAVER");
    expect(result.shippingHt).toBe(13.29);
    expect(call).toHaveBeenCalledWith("POST", "/shipping/shipping-possibilities", { address, item: { sku: "bureau-calendar", options: { copies: 1, size: "a5_landscape_tipi" } } });
  });
  it("does not invent or sum fees for a multi-product cart without a confirmed grouping", async () => {
    const call = vi.fn();
    expect((await calculateShipping([line, { ...line, sku: "flyers" }], address, call)).shippingHt).toBeNull();
    expect(call).not.toHaveBeenCalled();
  });
  it("does not silently convert repeated lots into a different print run", async () => {
    expect((await calculateShipping([{ ...line, quantity: 2 }], address, vi.fn())).shippingHt).toBeNull();
  });
  it("returns unknown transport and complete totals on provider failure, never 11.90 or zero", async () => {
    const result = await calculateShipping([line], address, vi.fn().mockRejectedValue(new Error("unavailable")));
    expect(result.shippingHt).toBeNull();
    expect(quoteTotals(56.3, result.shippingHt)).toMatchObject({ shippingHt: null, estimatedTotalHt: null, vatAmount: null, estimatedTotalTtc: null });
  });
  it("requires actual destination and avoids a mainland tariff for overseas", async () => {
    const call = vi.fn();
    expect((await calculateShipping([line], { country: "FR" }, call)).shippingHt).toBeNull();
    expect((await calculateShipping([line], { ...address, postalCode: "97100" }, call)).shippingHt).toBeNull();
    expect(call).not.toHaveBeenCalled();
  });
  it("invalid transport mode and invalid cost never produce a invented amount", async () => {
    expect((await calculateShipping([line], address, vi.fn().mockResolvedValue({ ok: true, data: response }), "FAKE")).shippingHt).toBeNull();
    expect(shippingChoices({ results: [{ possibilities: [{ method: "UPS", price: { cost: -1 } }, { method: "UPS", price: { cost: "9.14" } }] }] })).toEqual([]);
  });
  it("does not guess foreign VAT", () => {
    expect(quoteTotals(56.3, 9.14, "DE")).toMatchObject({ estimatedTotalHt: 65.44, vatAmount: null, estimatedTotalTtc: null });
  });
});