export interface QuantityProperty {
  slug: string;
  options?: Array<{ slug: string | number | null; type?: string; nullable?: boolean }>;
  rangeSets?: Array<{ printingmethod?: string; summary?: number[]; options?: Array<{ min: number; max: number; steps: number }> }>;
  optionsInSummary?: Array<string | number>;
  copyLimit?: Record<string, number>;
}
export type SupplierExclusions = Array<Array<{ property: string; options: Array<string | number> }>>;

export function isSupplierExcluded(selection: Record<string, unknown>, excludes: SupplierExclusions = []): boolean {
  return excludes.some(group => group.length > 0 && group.every(rule =>
    selection[rule.property] !== undefined && rule.options.some(value => String(value) === String(selection[rule.property]))));
}

/** Supplier ranges authorize custom quantities; options and summaries are only suggested values when ranges exist. */
export function supplierQuantities(property: QuantityProperty | undefined, selection: Record<string, unknown>, excludes: SupplierExclusions = []): number[] {
  if (!property) return [];
  const method = String(selection.printingmethod ?? "");
  const limit = property.copyLimit?.[method];
  const explicit = (property.options ?? []).filter(option => option.slug != null && !option.nullable && (!option.type || option.type === method));
  let candidates: number[] = [];
  if (property.rangeSets?.length) {
    const sets = property.rangeSets.filter(set => !set.printingmethod || set.printingmethod === method);
    for (const set of sets) for (const range of set.options ?? []) {
      if (!Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max) || !Number.isSafeInteger(range.steps)
        || range.min <= 0 || range.steps <= 0 || range.max < range.min) continue;
      const max = typeof limit === "number" ? Math.min(range.max, limit) : range.max;
      for (let value = range.min; value <= max; value += range.steps) candidates.push(value);
    }
  } else if (explicit.length) candidates = explicit.map(option => Number(option.slug));
  return [...new Set(candidates)].filter(value => Number.isSafeInteger(value) && value > 0
    && (typeof limit !== "number" || value <= limit)
    && !isSupplierExcluded({ ...selection, copies: value }, excludes.filter(group => group.some(rule => rule.property === "copies")))).sort((a, b) => a - b);
}

export function supplierSelection(product: { properties?: Array<{ slug: string; options?: Array<{ slug: string | number | null; nullable?: boolean }> }>; configurableProperties?: Array<{ slug: string; options?: Array<{ slug: string | number | null; nullable?: boolean }> }> }, selection: Record<string, unknown>): Record<string, unknown> {
  const result = { ...selection };
  for (const property of product.properties ?? product.configurableProperties ?? []) {
    if (result[property.slug] !== undefined || property.slug === "copies") continue;
    const implicit = property.options?.find(option => option.nullable && option.slug != null);
    if (implicit) result[property.slug] = implicit.slug;
  }
  return result;
}
/**
 * Next supplier-suggested quantity above `current` (explicit options and range
 * summaries), used when Print.com has no price for a quantity its range allows.
 */
export function nextSuggestedQuantity(property: QuantityProperty | undefined, selection: Record<string, unknown>, excludes: SupplierExclusions = [], current = 0): number | null {
  if (!property) return null;
  const method = String(selection.printingmethod ?? "");
  const allowed = new Set(supplierQuantities(property, selection, excludes));
  const suggested = [
    ...(property.options ?? []).filter(o => !o.type || o.type === method).map(o => Number(o.slug)),
    ...(property.rangeSets ?? []).filter(s => !s.printingmethod || s.printingmethod === method).flatMap(s => s.summary ?? []),
  ].filter(v => Number.isSafeInteger(v) && v > current && allowed.has(v)).sort((a, b) => a - b);
  return suggested[0] ?? null;
}
