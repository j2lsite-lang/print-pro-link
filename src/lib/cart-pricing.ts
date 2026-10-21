import { resaleFromSupplierHT, DESIGN_FEE_BASE } from "./pricing";

export function currentCartPrice(item: { supplierPriceHT?: number; includeDesignFee?: boolean; unitPrice: number | null }): number | null {
  const supplier = item.supplierPriceHT;
  if (typeof supplier !== "number" || !Number.isFinite(supplier) || supplier <= 0) return null;
  return resaleFromSupplierHT(supplier) + (item.includeDesignFee ? DESIGN_FEE_BASE : 0);
}