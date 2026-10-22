// Transport amounts are raw supplier HT, never product resale prices.
export type ShippingChoice = { method: string; carrier: string; cost: number; deliveryDate?: string };
export type ShippingLine = { sku: string; quantity: number; copies: number; configuration: Record<string, unknown> };
export type ShippingAddress = { country: string; postalCode?: string; city?: string; street?: string; houseNumber?: string };
export type SupplierCall = (method: string, path: string, body?: unknown) => Promise<{ ok: boolean; data: any }>;
export const SHIPPING_ON_QUOTE = "Livraison calculée sur devis";
export const roundMoney = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export function shippingChoices(data: any): ShippingChoice[] {
  const choices = new Map<string, ShippingChoice>();
  for (const group of Array.isArray(data?.results) ? data.results : []) {
    for (const p of Array.isArray(group?.possibilities) ? group.possibilities : []) {
      // cost already contains the supplier transport charge, not base + cost.
      const cost = p?.price?.cost;
      if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0 || !p.method || p.alternativeLocation) continue;
      const choice = { method: String(p.method), carrier: String(p.carrier || ""), cost: roundMoney(cost), deliveryDate: p.deliveryDate };
      const previous = choices.get(choice.method);
      if (!previous || choice.cost < previous.cost) choices.set(choice.method, choice);
    }
  }
  return [...choices.values()].sort((a, b) => a.cost - b.cost);
}

export function quoteTotals(productsHt: number, shippingHt: number | null, country = "FR") {
  const totalHt = shippingHt == null ? null : roundMoney(productsHt + shippingHt);
  // Foreign/overseas taxation is confirmed on the quote, never guessed.
  const vatRate = country === "FR" ? 0.2 : null;
  const vat = totalHt == null || vatRate == null ? null : roundMoney(totalHt * vatRate);
  return { productsTotalHt: roundMoney(productsHt), shippingHt, estimatedTotalHt: totalHt, vatRate, vatAmount: vat, estimatedTotalTtc: totalHt == null || vat == null ? null : roundMoney(totalHt + vat) };
}

export async function calculateShipping(lines: ShippingLine[], address: ShippingAddress, call: SupplierCall, method?: string) {
  const unavailable = { status: "on_quote" as const, shippingHt: null, choices: [] as ShippingChoice[], selectedMethod: null as string | null };
  // No country-only amount advertised as an address-confirmed cart total.
  if (!address.country || !address.postalCode || !address.city || !lines.length) return unavailable;
  if (address.country === "FR" && /^(97|98)/.test(address.postalCode)) return unavailable;
  try {
    // Repeated lots are not converted to a different print configuration.
    // Without a verified combined-shipment quote they must be quoted manually.
    if (lines.length !== 1 || lines[0].quantity !== 1) return unavailable;
    const line = lines[0];
    const { urgency: _urgency, ...options } = line.configuration;
    const response = await call("POST", "/shipping/shipping-possibilities", {
      address, item: { sku: line.sku, options: { ...options, copies: line.copies } },
    });
    if (!response.ok) return unavailable;
    const choices = shippingChoices(response.data);
    const selected = method ? choices.find(c => c.method === method) : choices[0];
    if (!selected) return { ...unavailable, choices };
    return { status: "calculated" as const, shippingHt: selected.cost, choices, selectedMethod: selected.method };
  } catch { return unavailable; }
}