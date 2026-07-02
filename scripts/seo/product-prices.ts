// ============================================================================
// Real "default configuration" price resolution for the Product JSON-LD.
// ----------------------------------------------------------------------------
// For every public SKU we replicate EXACTLY what the on-site configurator does
// for its initial state:
//   1. build the valid default options (first non-nullable value per required/
//      locked visible property, avoiding excluded combinations),
//   2. pick the default quantity (first quantity offered for the default method),
//   3. inject hidden REQUIRED properties (e.g. printingmethod) with their real
//      Print.com value,
//   4. call get-price with the same self-correcting resolver as the UI,
//   5. apply the SAME resale pricing (getResalePrice → ×1.5, arrondi 0,10 €).
//
// The number we cache is therefore byte-for-byte the HT price shown in the
// configurator for the default configuration. We NEVER invent a price: if the
// API can't resolve one we keep the previous cached value (or omit `offers`).
//
// BUILD-TIME ONLY. Never bundled at runtime, never touches the cart, the quote
// flow or the visible prices. Results cached to
// src/seo/generated/product-prices.json.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { getResalePrice } from "../../src/lib/pricing";

export interface ProductPrice {
  sku: string;
  /** Resale HT price for the default configuration (EUR), matching the UI. */
  price: number;
  /** Default quantity (copies) used to compute the price. */
  copies: number;
}

const PRICES_PATH = resolve("src/seo/generated/product-prices.json");

/* --------------------------------------------------------------------------
 * Pure helpers — faithfully ported from src/pages/ProductDetail.tsx so the
 * build-time default config is identical to the runtime one.
 * ------------------------------------------------------------------------ */
type Opt = { slug?: string | number | null; name?: string; nullable?: boolean };
type Prop = {
  slug: string;
  title?: string;
  required?: boolean;
  locked?: boolean;
  options?: Opt[];
  optionsInSummary?: (string | number)[];
  rangeSets?: { printingmethod?: string; summary?: number[]; options?: { min?: number; max?: number; steps?: number }[] }[];
};
type ExcludeConstraint = { property: string; options: string[] };
type ExcludeGroup = ExcludeConstraint[];

function isExcludedCombination(selected: Record<string, string>, excludes: ExcludeGroup[] | undefined): boolean {
  if (!excludes?.length) return false;
  return excludes.some((group) =>
    group.every((c) => {
      const val = selected[c.property];
      return val !== undefined && c.options.includes(val);
    }),
  );
}

function realOptionValue(prop: Prop | undefined, exclude: (string | undefined)[] = []): string | undefined {
  if (!prop?.options?.length) return undefined;
  const candidates = prop.options.filter((o) => !o.nullable && o.slug != null).map((o) => String(o.slug));
  return candidates.find((c) => !exclude.includes(c)) ?? candidates[0];
}

function buildValidDefaults(allProps: Prop[], excludes: ExcludeGroup[] | undefined, hiddenSlugs: Set<string>): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const prop of allProps) {
    if (prop.slug === "copies") continue;
    if (hiddenSlugs.has(prop.slug)) continue;
    if (!prop.options?.length) continue;
    const nonNullable = prop.options.filter((o) => !o.nullable);
    if (nonNullable.length === 0) continue;
    if (prop.locked || prop.required) defaults[prop.slug] = String(nonNullable[0].slug);
  }
  let maxIterations = 10;
  while (maxIterations-- > 0 && isExcludedCombination(defaults, excludes)) {
    let fixed = false;
    for (const prop of allProps) {
      if (prop.slug === "copies" || !prop.options?.length) continue;
      if (hiddenSlugs.has(prop.slug)) continue;
      if (!defaults[prop.slug]) continue;
      const nonNullable = prop.options.filter((o) => !o.nullable);
      for (const opt of nonNullable) {
        const test = { ...defaults, [prop.slug]: String(opt.slug) };
        if (!isExcludedCombination(test, excludes)) { defaults[prop.slug] = String(opt.slug); fixed = true; break; }
      }
      if (fixed) break;
    }
    if (!fixed) break;
  }
  return defaults;
}

function copiesCandidates(cp: Prop | undefined, method: string | undefined): string[] {
  if (!cp) return [];
  if (cp.rangeSets?.length) {
    const set = cp.rangeSets.find((r) => r.printingmethod === method) || cp.rangeSets[0];
    if (set.summary?.length) return set.summary.map(String);
    if (set.options?.length) {
      const out: string[] = [];
      for (const r of set.options) {
        for (let i = r.min || 1; i <= (r.max || 1); i += r.steps || 1) { out.push(String(i)); if (out.length > 40) break; }
      }
      return out;
    }
  }
  if (cp.optionsInSummary?.length) return cp.optionsInSummary.map(String);
  if (cp.options?.length) return cp.options.filter((o) => o.slug != null).map((o) => String(o.slug));
  return [];
}

/** Default quantity the configurator selects (first offered for default method). */
function defaultQuantity(allProps: Prop[]): number | null {
  const copiesProp = allProps.find((p) => p.slug === "copies");
  if (!copiesProp) return null;
  const printingMethodProp = allProps.find((p) => p.slug === "printingmethod");
  const method = realOptionValue(printingMethodProp) || "";
  const cands = copiesCandidates(copiesProp, method);
  if (!cands.length) return null;
  const n = parseInt(cands[0], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveLocally(
  props: Prop[], copiesProp: Prop | undefined, options: Record<string, any>, copies: number,
  excludes: ExcludeGroup[], protectedKeys: Set<string>,
): { options: Record<string, any>; copies: number } {
  const find = (s: string) => props.find((p) => p.slug === s);
  const rank = (s: string) => (s === "size" || s === "material" ? 4 : s === "copies" ? 3 : protectedKeys.has(s) ? 2 : 1);
  let it = 60;
  while (it-- > 0) {
    const sel = { ...options, copies: String(copies) };
    if (!isExcludedCombination(sel, excludes)) break;
    let acted = false;
    for (const g of excludes) {
      const violated = g.every((c) => { const v = sel[c.property]; return v !== undefined && c.options.includes(v); });
      if (!violated) continue;
      const ordered = [...g].sort((a, b) => rank(a.property) - rank(b.property));
      for (const c of ordered) {
        if (c.property === "copies") {
          for (const cc of copiesCandidates(copiesProp, options.printingmethod)) {
            if (!isExcludedCombination({ ...options, copies: cc }, excludes)) { copies = Number(cc); acted = true; break; }
          }
        } else {
          const prop = find(c.property);
          if (!prop) continue;
          const cands = (prop.options || []).filter((o) => !o.nullable && o.slug != null).map((o) => String(o.slug));
          for (const cand of cands) {
            if (cand === options[c.property]) continue;
            if (!isExcludedCombination({ ...options, [c.property]: cand, copies: String(copies) }, excludes)) {
              options[c.property] = cand; acted = true; break;
            }
          }
        }
        if (acted) break;
      }
      if (acted) break;
    }
    if (!acted) {
      const sel2 = { ...options, copies: String(copies) };
      let dropped = false;
      for (const g of excludes) {
        const violated = g.every((c) => { const v = sel2[c.property]; return v !== undefined && c.options.includes(v); });
        if (!violated) continue;
        const cand = [...g].sort((a, b) => rank(a.property) - rank(b.property)).find((c) => rank(c.property) === 1 && options[c.property] !== undefined);
        if (cand) { delete options[cand.property]; dropped = true; break; }
      }
      if (!dropped) break;
    }
  }
  return { options, copies };
}

function parseMissingProps(message: string): string[] {
  const out: string[] = [];
  const re = /missing required property:\s*([a-zA-Z0-9_.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(message))) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

function parseExcludedGroups(message: string): ExcludeConstraint[][] {
  const groups: ExcludeConstraint[][] = [];
  const re = /excluded configuration was provided:\s*([a-zA-Z0-9_:,.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(message))) {
    const pairs = m[1].split(",").map((s) => s.trim()).filter((s) => s.includes(":")).map((s) => {
      const idx = s.indexOf(":");
      return { property: s.slice(0, idx), options: [s.slice(idx + 1)] };
    });
    if (pairs.length) groups.push(pairs);
  }
  return groups;
}

/* --------------------------------------------------------------------------
 * API calls (build-time) with bounded concurrency, retry and cache.
 * ------------------------------------------------------------------------ */
async function fetchProduct(sb: string, anon: string, sku: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(
        `${sb}/functions/v1/printcom-proxy?action=get-product&sku=${encodeURIComponent(sku)}&view=reseller&lang=fr-FR`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
      );
      if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.properties)) return j; }
    } catch { /* retry */ }
    await new Promise((s) => setTimeout(s, 300 * (attempt + 1)));
  }
  return null;
}

async function callPrice(sb: string, anon: string, sku: string, body: Record<string, any>): Promise<any | null> {
  try {
    const r = await fetch(
      `${sb}/functions/v1/printcom-proxy?action=get-price&sku=${encodeURIComponent(sku)}&lang=fr-FR`,
      { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    const text = await r.text();
    if (!r.ok) {
      // Keep the API's own validation message so the resolver can react to
      // "missing required property" / "excluded configuration" errors.
      let msg = text;
      try { msg = JSON.parse(text)?.errorMessage || text; } catch { /* raw text */ }
      return { error: msg || `HTTP ${r.status}` };
    }
    try { return JSON.parse(text); } catch { return { error: "invalid JSON" }; }
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

/** Self-correcting price call, mirroring resolvePrice() in the UI. */
async function resolvePrice(
  sb: string, anon: string, sku: string, product: any, baseOptions: Record<string, any>,
  copies0: number, copiesProp: Prop | undefined,
): Promise<{ data: any; copies: number } | null> {
  const props: Prop[] = product.properties || product.configurableProperties || [];
  const excludes: ExcludeGroup[] = product.excludes || [];
  const findProp = (slug: string) => props.find((p) => p.slug === slug);
  const protectedKeys = new Set<string>();
  let { options, copies } = resolveLocally(props, copiesProp, { ...baseOptions }, copies0, excludes, protectedKeys);
  const seen = new Set<string>();
  let lastError = "";

  for (let attempt = 0; attempt < 14; attempt++) {
    const body = { ...options, copies };
    const stateKey = JSON.stringify(body);
    if (seen.has(stateKey)) break;
    seen.add(stateKey);

    const data = await callPrice(sb, anon, sku, body);
    if (data && !data.error && !data.errorMessage) return { data, copies };
    lastError = data?.errorMessage || data?.error || "";

    const missing = parseMissingProps(lastError);
    if (missing.length) {
      let added = false;
      for (const slug of missing) {
        const v = realOptionValue(findProp(slug));
        if (v !== undefined && options[slug] !== v) { options[slug] = v; added = true; }
      }
      if (added) { ({ options, copies } = resolveLocally(props, copiesProp, options, copies, excludes, protectedKeys)); continue; }
    }

    const groups = parseExcludedGroups(lastError);
    if (groups.length) {
      let changed = false;
      for (const group of groups) {
        for (const pair of group) {
          const prop = findProp(pair.property);
          if (!prop) continue;
          const alt = realOptionValue(prop, [options[pair.property]]);
          if (alt !== undefined && alt !== options[pair.property]) { options[pair.property] = alt; changed = true; break; }
        }
        if (changed) break;
      }
      if (changed) { ({ options, copies } = resolveLocally(props, copiesProp, options, copies, excludes, protectedKeys)); continue; }
    }
    break;
  }
  return null;
}

/** Compute the default-config resale price for a single product (or null). */
async function computePrice(sb: string, anon: string, sku: string): Promise<ProductPrice | null> {
  const product = await fetchProduct(sb, anon, sku);
  if (!product) return null;
  const allProps: Prop[] = product.properties || product.configurableProperties || [];

  const hiddenSlugs = new Set<string>();
  for (const group of product.propertyGroups || []) {
    if (group?.columnWidth?.reseller === "hidden") (group.properties || []).forEach((s: string) => hiddenSlugs.add(s));
  }

  const defaults = buildValidDefaults(allProps, product.excludes, hiddenSlugs);
  const copies = defaultQuantity(allProps);
  if (!copies) return null;

  const cleanOptions: Record<string, any> = {};
  for (const [k, v] of Object.entries(defaults)) if (v !== undefined && v !== null && v !== "") cleanOptions[k] = v;

  const hiddenRequired: Record<string, any> = {};
  for (const prop of allProps) {
    if (!hiddenSlugs.has(prop.slug)) continue;
    if (!prop.required) continue;
    const v = realOptionValue(prop);
    if (v !== undefined) hiddenRequired[prop.slug] = v;
  }

  const baseOptions = { ...hiddenRequired, ...cleanOptions };
  const copiesProp = allProps.find((p) => p.slug === "copies");
  const resolved = await resolvePrice(sb, anon, sku, product, baseOptions, copies, copiesProp);
  if (!resolved?.data) return null;

  const price = getResalePrice(resolved.data);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { sku, price, copies: resolved.copies };
}

/* --------------------------------------------------------------------------
 * Cache + public loader.
 * ------------------------------------------------------------------------ */
function loadCache(): Record<string, ProductPrice> {
  if (!existsSync(PRICES_PATH)) return {};
  try { return JSON.parse(readFileSync(PRICES_PATH, "utf8")); } catch { return {}; }
}

function saveCache(map: Record<string, ProductPrice>) {
  mkdirSync(resolve("src/seo/generated"), { recursive: true });
  writeFileSync(PRICES_PATH, JSON.stringify(map, null, 0));
}

/**
 * Returns a SKU→price map for the given SKUs. Refreshes from the live API
 * (concurrency-limited) and keeps previously cached values when a fetch fails.
 */
export async function loadProductPrices(
  skus: string[], sb: string | undefined, anon: string | undefined,
): Promise<Map<string, ProductPrice>> {
  const cache = loadCache();
  if (sb && anon && skus.length) {
    let i = 0, refreshed = 0;
    const conc = 8;
    const worker = async () => {
      while (i < skus.length) {
        const sku = skus[i++];
        const pp = await computePrice(sb, anon, sku);
        if (pp) { cache[sku] = pp; refreshed++; }
      }
    };
    await Promise.all(Array.from({ length: conc }, worker));
    saveCache(cache);
    console.log(`Product prices: refreshed ${refreshed}/${skus.length} (cached total ${Object.keys(cache).length})`);
  }
  const out = new Map<string, ProductPrice>();
  for (const sku of skus) if (cache[sku]) out.set(sku, cache[sku]);
  return out;
}
