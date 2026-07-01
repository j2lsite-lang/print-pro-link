// ============================================================================
// Product attribute extraction from the REAL Print.com catalog (get-product).
// ----------------------------------------------------------------------------
// Pulls the live product specification for every public SKU and distils it into
// a COMPACT, factual `ProductAttributes` record. From those real attributes we
// derive natural French SEO expressions ("flyer A5 recto verso", "carte de
// visite pelliculée mate", "panneau Dibond extérieur"…). We NEVER invent a
// format, a material, a finish, a quantity or an option that the API does not
// return — absent attributes simply produce no phrase.
//
// This module is BUILD-TIME ONLY. It never touches prices, the configurator,
// the cart, the quote flow or the runtime bundle. Results are cached to
// src/seo/generated/product-specs.json and merged defensively: if the API
// fails for a SKU we keep the previously cached value so builds stay green.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { pickN } from "../../src/seo/data/semantic-keywords";

export interface ProductAttributes {
  sku: string;
  /** Human singular product label (e.g. "Flyer"). */
  singular: string;
  /** Clean short format labels really available (A5, A4, DL, 85 x 55 mm…). */
  formats: string[];
  /** Faces réellement proposées : "recto" and/or "recto verso". */
  faces: string[];
  /** Pelliculage disponible : subset of "mat", "brillant", "soft touch". */
  pelliculage: string[];
  /** Vernis sélectif disponible : subset of "brillant", "mat". */
  vernis: string[];
  /** Dorure / marquage à chaud proposé. */
  dorure: boolean;
  /** Coins arrondis proposés. */
  coinsArrondis: boolean;
  /** Découpe à la forme proposée. */
  decoupe: boolean;
  /** Œillets proposés (bâches). */
  oeillets: boolean;
  /** Familles de matières réellement présentes (Couché, Dibond, PVC…). */
  matieres: string[];
  /** Plage de grammages g/m² réellement présente. */
  grammageMin?: number;
  grammageMax?: number;
  /** Usage extérieur détecté dans les matières/finitions (résistant, UV…). */
  exterieur: boolean;
}

const SPECS_PATH = resolve("src/seo/generated/product-specs.json");

/* --------------------------------------------------------------------------
 * Extraction helpers — pure, deterministic, only read what the API returns.
 * ------------------------------------------------------------------------ */
const optName = (o: any): string => String(o?.name || o?.slug || "").trim();

/** Standard format label from a size option name ("A5 - 148 x 210 mm" → "A5"). */
function cleanFormat(raw: string): string | null {
  const n = raw.trim();
  if (!n || /^custom$/i.test(n) || /défini|defini|non imprim/i.test(n)) return null;
  // Standard paper/DL/square labels before the dimension part.
  const m = n.match(/^(A0|A1|A2|A3|A4|A5|A6|A7|DL|carr[ée])/i);
  if (m) {
    const orient = /paysage/i.test(n) ? " paysage" : "";
    return `${m[1].toUpperCase()}${orient}`;
  }
  // Dimension-only labels ("100 x 100 cm", "85 x 55 mm").
  const dim = n.match(/(\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?\s*(?:mm|cm|m))/i);
  if (dim) return dim[1].replace(/\s+/g, " ").replace("×", "x");
  return null;
}

function extractFormats(prop: any): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const o of prop?.options || []) {
    const f = cleanFormat(optName(o));
    if (f && !seen.has(f.toLowerCase())) { seen.add(f.toLowerCase()); out.push(f); }
  }
  return out.slice(0, 10);
}

function extractFaces(prop: any): string[] {
  let rectoVerso = false, recto = false;
  for (const o of prop?.options || []) {
    const n = optName(o).toLowerCase();
    if (/recto\s*\/\s*verso|recto-verso|4\/4|5\/5/.test(n)) rectoVerso = true;
    else if (/recto|4\/0|5\/0/.test(n)) recto = true;
  }
  const out: string[] = [];
  if (recto) out.push("recto");
  if (rectoVerso) out.push("recto verso");
  return out;
}

function extractFinish(prop: any): { pelliculage: string[]; vernis: string[] } {
  const pel = new Set<string>();
  const ver = new Set<string>();
  for (const o of prop?.options || []) {
    const n = optName(o).toLowerCase();
    if (/soft\s*touch|velours/.test(n)) pel.add("soft touch");
    else if (/pelliculage.*mat|lamination.*mat/.test(n)) pel.add("mat");
    else if (/pelliculage.*brillant|lamination.*brillant/.test(n)) pel.add("brillant");
    if (/vernis.*mat/.test(n)) ver.add("mat");
    else if (/vernis.*brillant|vernis uv brillant/.test(n)) ver.add("brillant");
  }
  return { pelliculage: [...pel], vernis: [...ver] };
}

/** Family word from a material option name ("Couché brillant 170 g/m²" → "couché"). */
function materialFamily(raw: string): string | null {
  const n = raw.toLowerCase();
  const map: [RegExp, string][] = [
    [/dibond/, "Dibond"], [/forex|foam|pvc expansé|akylux|akilux|cannelé|alvéol/, "PVC"],
    [/plexi|acryl/, "plexiglas"], [/alumin/, "aluminium"], [/dos bleu|blueback|blue back/, "papier dos bleu"],
    [/kraft/, "kraft"], [/recycl/, "papier recyclé"], [/couché|couche/, "papier couché"],
    [/offset|bankpost|non couché/, "papier offset"], [/vinyle|vinyl|adhésif|adhesif/, "vinyle adhésif"],
    [/bâche|bache|pvc/, "bâche PVC"], [/mesh|microperfor/, "bâche microperforée"],
    [/toile|canvas|polyester|tissu/, "toile"], [/carton|board/, "carton"],
    [/magnét|magnet/, "magnétique"],
  ];
  for (const [re, label] of map) if (re.test(n)) return label;
  return null;
}

function extractMaterials(prop: any): { matieres: string[]; grammageMin?: number; grammageMax?: number; exterieur: boolean } {
  const fams = new Set<string>();
  let gMin = Infinity, gMax = -Infinity;
  let ext = false;
  for (const o of prop?.options || []) {
    const n = optName(o);
    const fam = materialFamily(n);
    if (fam) fams.add(fam);
    const g = n.match(/(\d{2,4})\s*g\/m/);
    if (g) { const v = Number(g[1]); if (v < gMin) gMin = v; if (v > gMax) gMax = v; }
    if (/extérieur|exterieur|résistant|resistant|uv|imperm|waterproof|pvc|dibond|vinyle|bâche|bache|forex|alumin/i.test(n)) ext = true;
  }
  return {
    matieres: [...fams].slice(0, 5),
    grammageMin: gMin === Infinity ? undefined : gMin,
    grammageMax: gMax === -Infinity ? undefined : gMax,
    exterieur: ext,
  };
}

function hasRealOption(prop: any): boolean {
  // A property offers a real choice when at least one non-"Sans/Non" option exists.
  return (prop?.options || []).some((o: any) => !/^(sans|non|pas de|no|ne pas)/i.test(optName(o)));
}

export function extractAttributes(product: any): ProductAttributes | null {
  if (!product?.sku || !Array.isArray(product.properties)) return null;
  const bySlug = new Map<string, any>();
  for (const p of product.properties) bySlug.set(p.slug, p);

  const finish = extractFinish(bySlug.get("finish"));
  const materials = extractMaterials(bySlug.get("material"));
  const spot = bySlug.get("spot_finish");
  const rounded = bySlug.get("rounded_corners");
  const die = bySlug.get("die_cut");
  const holes = bySlug.get("drillholes") || bySlug.get("eyelets") || bySlug.get("oeillets");

  return {
    sku: product.sku,
    singular: String(product.titleSingle || product.name || product.sku).trim(),
    formats: extractFormats(bySlug.get("size")),
    faces: extractFaces(bySlug.get("printtype") || bySlug.get("sides")),
    pelliculage: finish.pelliculage,
    vernis: finish.vernis,
    dorure: spot ? hasRealOption(spot) : false,
    coinsArrondis: rounded ? hasRealOption(rounded) : false,
    decoupe: die ? hasRealOption(die) : false,
    oeillets: holes ? hasRealOption(holes) : false,
    matieres: materials.matieres,
    grammageMin: materials.grammageMin,
    grammageMax: materials.grammageMax,
    exterieur: materials.exterieur,
  };
}

/* --------------------------------------------------------------------------
 * Fetching (build-time) with bounded concurrency, retry and defensive cache.
 * ------------------------------------------------------------------------ */
function loadCache(): Record<string, ProductAttributes> {
  if (!existsSync(SPECS_PATH)) return {};
  try { return JSON.parse(readFileSync(SPECS_PATH, "utf8")); } catch { return {}; }
}

function saveCache(map: Record<string, ProductAttributes>) {
  mkdirSync(resolve("src/seo/generated"), { recursive: true });
  writeFileSync(SPECS_PATH, JSON.stringify(map, null, 0));
}

async function fetchProduct(sb: string, anon: string, sku: string): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(
        `${sb}/functions/v1/printcom-proxy?action=get-product&sku=${encodeURIComponent(sku)}&view=reseller&lang=fr-FR`,
        { headers: { apikey: anon, Authorization: `Bearer ${anon}` } },
      );
      if (r.ok) {
        const j = await r.json();
        if (j && Array.isArray(j.properties)) return j;
      }
    } catch { /* retry */ }
    await new Promise((s) => setTimeout(s, 300 * (attempt + 1)));
  }
  return null;
}

/**
 * Returns a SKU→attributes map for the given SKUs. Refreshes the cache from the
 * live API (concurrency-limited) and keeps previous values when a fetch fails.
 */
export async function loadProductAttributes(
  skus: string[],
  sb: string | undefined,
  anon: string | undefined,
): Promise<Map<string, ProductAttributes>> {
  const cache = loadCache();
  if (sb && anon && skus.length) {
    let i = 0;
    let refreshed = 0;
    const conc = 10;
    const worker = async () => {
      while (i < skus.length) {
        const sku = skus[i++];
        const prod = await fetchProduct(sb, anon, sku);
        const attrs = prod ? extractAttributes(prod) : null;
        if (attrs) { cache[sku] = attrs; refreshed++; }
      }
    };
    await Promise.all(Array.from({ length: conc }, worker));
    saveCache(cache);
    console.log(`Product specs: refreshed ${refreshed}/${skus.length} (cached total ${Object.keys(cache).length})`);
  }
  const out = new Map<string, ProductAttributes>();
  for (const sku of skus) if (cache[sku]) out.set(sku, cache[sku]);
  return out;
}

/* --------------------------------------------------------------------------
 * Natural French SEO phrases derived from the REAL attributes.
 * ------------------------------------------------------------------------ */
const lc = (s: string) => s.toLowerCase();

/** Adjective form of pelliculage: "mat" → "pelliculé mat". */
function pelliculePhrase(p: string): string {
  if (p === "soft touch") return "pelliculage soft touch";
  return `pelliculé ${p}`;
}

/**
 * Build natural, factual long-tail expressions from the product's real specs.
 * Seeded so twin products don't share an identical list. Only present
 * attributes generate phrases — nothing is invented.
 */
export function productAttributePhrases(attrs: ProductAttributes, seed: number): string[] {
  const base = lc(attrs.singular);
  const out: string[] = [];

  // Format-based ("flyer A5", "flyer A5 recto verso").
  const fmts = pickN(attrs.formats, seed, Math.min(4, attrs.formats.length));
  for (const f of fmts) {
    out.push(`${base} ${f}`);
    if (attrs.faces.includes("recto verso")) out.push(`${base} ${f} recto verso`);
  }
  // Faces alone.
  if (attrs.faces.includes("recto verso")) out.push(`${base} recto verso`);
  // Pelliculage.
  for (const p of attrs.pelliculage) out.push(`${base} ${pelliculePhrase(p)}`);
  // Vernis sélectif.
  if (attrs.vernis.length) out.push(`${base} vernis sélectif`);
  // Dorure.
  if (attrs.dorure) out.push(`${base} avec dorure`);
  // Forme.
  if (attrs.coinsArrondis) out.push(`${base} coins arrondis`);
  if (attrs.decoupe) out.push(`${base} découpé à la forme`);
  if (attrs.oeillets) out.push(`${base} avec œillets`);
  // Matières.
  for (const m of attrs.matieres.slice(0, 2)) out.push(`${base} ${lc(m)}`);
  // Usage extérieur.
  if (attrs.exterieur) out.push(`${base} extérieur résistant`);

  // Dedup + cap.
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const v of out) { const k = v.replace(/\s+/g, " ").trim().toLowerCase(); if (v && !seen.has(k)) { seen.add(k); uniq.push(v.replace(/\s+/g, " ").trim()); } }
  return uniq.slice(0, 12);
}

/** Human "Formats et options disponibles" bullets (only real attributes). */
export function productAttributeBullets(attrs: ProductAttributes): string[] {
  const b: string[] = [];
  if (attrs.formats.length) b.push(`Formats disponibles : ${attrs.formats.slice(0, 8).join(", ")}.`);
  if (attrs.faces.length) b.push(`Impression ${attrs.faces.join(" ou ")}.`);
  if (attrs.matieres.length) b.push(`Supports : ${attrs.matieres.join(", ")}.`);
  if (attrs.grammageMin && attrs.grammageMax && attrs.grammageMin !== attrs.grammageMax) {
    b.push(`Grammages de ${attrs.grammageMin} à ${attrs.grammageMax} g/m².`);
  }
  const fin: string[] = [];
  for (const p of attrs.pelliculage) fin.push(`pelliculage ${p}`);
  if (attrs.vernis.length) fin.push("vernis sélectif");
  if (attrs.dorure) fin.push("dorure");
  if (attrs.coinsArrondis) fin.push("coins arrondis");
  if (attrs.decoupe) fin.push("découpe à la forme");
  if (attrs.oeillets) fin.push("œillets");
  if (fin.length) b.push(`Finitions : ${fin.join(", ")}.`);
  if (attrs.exterieur) b.push("Adapté à un usage extérieur résistant.");
  return b;
}
