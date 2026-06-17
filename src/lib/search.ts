/**
 * Lightweight, dependency-free product search engine.
 *
 * Features:
 *  - normalisation (lowercase, accent stripping, hyphen/space collapsing)
 *  - French synonyms (flyer/prospectus/tract, affiche/poster, …)
 *  - fuzzy matching (Levenshtein) tolerant to typos, missing letters,
 *    plurals/singulars, accents, hyphens, spaces and inverted words
 *  - relevance scoring with a clear priority order
 *
 * Pure functions only — no API calls, no side effects.
 */

export interface SearchableProduct {
  sku: string;
  name: string;
  category?: string;
  description?: string;
}

/** Normalise a string: lowercase, strip accents, collapse separators. */
export function normalize(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[-_/]+/g, " ") // hyphens/underscores/slashes -> space
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenise into normalised words (plurals reduced to a stable stem). */
export function tokenize(input: string): string[] {
  return normalize(input)
    .split(" ")
    .filter(Boolean)
    .map(stem);
}

/** Very small French stemmer: drop a trailing plural/feminine "s"/"x". */
function stem(word: string): string {
  if (word.length > 4 && /(s|x)$/.test(word)) return word.slice(0, -1);
  return word;
}

/**
 * Synonym groups. Every term in a group is treated as equivalent.
 * Only families that exist in the J2L catalogue are listed.
 */
const SYNONYM_GROUPS: string[][] = [
  ["flyer", "prospectus", "tract", "depliant publicitaire"],
  ["affiche", "poster"],
  ["bache", "banderole", "banner", "kakemono publicitaire"],
  ["autocollant", "sticker", "adhesif", "vinyle"],
  ["depliant", "brochure", "plaquette"],
  ["carte de visite", "carte visite", "cartes professionnelles", "businesscard", "businesscards"],
  ["roll up", "rollup", "kakemono", "enrouleur", "totem"],
  ["panneau", "plaque", "signaletique", "enseigne"],
  ["sac", "sachet", "emballage", "bag"],
  ["vetement", "textile", "tee shirt", "t shirt", "tshirt", "polo", "sweat"],
  ["objet publicitaire", "goodies", "cadeau publicitaire", "objet promotionnel"],
  ["menu", "carte restaurant"],
  ["set de table", "sous main", "napperon"],
  ["etiquette", "label", "sticker etiquette"],
  ["drapeau", "pavillon", "oriflamme"],
  ["bouteille", "gourde", "drinking bottle", "drinkingbottle"],
  ["mug", "tasse", "gobelet"],
  ["carte postale", "postcard", "postcards"],
  ["enveloppe", "envelope", "envelopes"],
  ["bloc note", "carnet", "notebook"],
];

/** Build a fast lookup: token -> set of equivalent tokens. */
const SYNONYM_INDEX: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const all = new Set<string>();
    for (const term of group) for (const t of tokenize(term)) all.add(t);
    for (const t of all) {
      if (!map.has(t)) map.set(t, new Set());
      const set = map.get(t)!;
      for (const other of all) set.add(other);
    }
  }
  return map;
})();

/** Expand a list of query tokens with their synonyms. */
function expandSynonyms(tokens: string[]): Set<string> {
  const out = new Set<string>(tokens);
  for (const t of tokens) {
    const syns = SYNONYM_INDEX.get(t);
    if (syns) for (const s of syns) out.add(s);
  }
  return out;
}

/** Levenshtein distance (iterative, O(n*m)). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Fuzzy token equality: tolerant to small typos relative to length. */
function fuzzyTokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  const maxLen = Math.max(a.length, b.length);
  const tolerance = maxLen <= 4 ? 1 : maxLen <= 7 ? 2 : 3;
  return levenshtein(a, b) <= tolerance;
}

/**
 * Score a product against a query. Higher = more relevant; 0 = no match.
 * Priority: exact title > exact synonym > title prefix > category >
 * description > fuzzy/approximate.
 */
export function scoreProduct(product: SearchableProduct, rawQuery: string): number {
  const q = normalize(rawQuery);
  if (!q) return 1; // empty query keeps everything

  const nameNorm = normalize(product.name);
  const queryTokens = tokenize(rawQuery);
  if (queryTokens.length === 0) return 1;

  const expanded = expandSynonyms(queryTokens);
  const nameTokens = tokenize(product.name);
  const catTokens = product.category ? tokenize(product.category) : [];
  const descTokens = product.description ? tokenize(product.description) : [];

  let score = 0;

  // Exact full-title match
  if (nameNorm === q) score += 1000;

  // Whole query appears as substring in the title
  if (nameNorm.includes(q)) score += 200;

  // SKU contains the raw (helps power users)
  if (product.sku.toLowerCase().includes(q.replace(/\s+/g, "-"))) score += 120;

  // Title starts with the first query token
  if (nameTokens[0] && nameTokens[0].startsWith(queryTokens[0])) score += 80;

  for (const qt of queryTokens) {
    // Exact token in title
    if (nameTokens.includes(qt)) score += 60;
    // Synonym hit in title
    else if (nameTokens.some((nt) => expanded.has(nt))) score += 45;
    // Category match
    else if (catTokens.includes(qt) || catTokens.some((ct) => expanded.has(ct))) score += 25;
    // Description match
    else if (descTokens.includes(qt)) score += 12;
    // Fuzzy / approximate match against title
    else if (nameTokens.some((nt) => fuzzyTokenMatch(nt, qt))) score += 20;
    // Fuzzy against any expanded synonym present in the title
    else if (nameTokens.some((nt) => [...expanded].some((e) => fuzzyTokenMatch(nt, e)))) score += 10;
  }

  return score;
}

/** Search + sort. Returns matching products ordered by relevance. */
export function searchProducts<T extends SearchableProduct>(
  products: T[],
  query: string,
  limit?: number,
): T[] {
  if (!query.trim()) return limit ? products.slice(0, limit) : products;
  const scored = products
    .map((p) => ({ p, s: scoreProduct(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name, "fr"));
  const result = scored.map((x) => x.p);
  return limit ? result.slice(0, limit) : result;
}
