/**
 * Automated SEMANTIC SEO audit for the J2L Print catalog.
 * Run with:  tsx scripts/seo/audit-seo.ts
 *
 * Reads the generated SEO model (pages.json + products.json + themes.json) and
 * verifies the editorial / structured-data quality of every CATALOG page:
 *   categories, subcategories, products, themes, home, catalogue, services.
 *
 * It NEVER touches prices, SKUs, the Print.com API or the configurator — it only
 * inspects already-generated editorial content + JSON-LD. Geographic pages
 * (villes / départements / régions) are intentionally out of scope.
 *
 * The script prints a numbered report and EXITS NON-ZERO when a blocking
 * anomaly is found, so it can gate the build.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { SeoPage } from "../../src/seo/types";
import { getProductSEOData, detectFamily } from "../../src/lib/product-seo";
import { FAMILY_KEYWORDS } from "../../src/seo/data/semantic-keywords";

/* ------------------------------------------------------------------ loaders */
function load(file: string): Record<string, SeoPage> {
  const p = resolve(file);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8")) as Record<string, SeoPage>;
  } catch {
    return {};
  }
}

const PAGES = load("src/seo/generated/pages.json");
const PRODUCTS = load("src/seo/generated/products.json");
const THEMES = load("src/seo/generated/themes.json");

const SERVICE_PATHS = [
  "/impression-numerique", "/grand-format", "/supports-publicitaires", "/personnalisation",
];

// Every existing internal path (used for the 404 check).
const ALL_PATHS = new Set<string>([
  ...Object.keys(PAGES), ...Object.keys(PRODUCTS), ...Object.keys(THEMES),
  ...SERVICE_PATHS, "/", "/catalogue", "/products", "/themes", "/imprimerie",
]);

const seg = (path: string) => path.split("/").filter(Boolean);
const isCategory = (p: SeoPage) => seg(p.path)[0] === "categorie" && seg(p.path).length === 2;
const isSubcategory = (p: SeoPage) => seg(p.path)[0] === "categorie" && seg(p.path).length === 3;
const isProduct = (p: SeoPage) => seg(p.path)[0] === "products";
const isTheme = (p: SeoPage) => seg(p.path)[0] === "themes";

// Catalog scope only (geo pages excluded on purpose).
const CATALOG: SeoPage[] = [
  ...Object.values(PAGES).filter(
    (p) => p.path === "/" || p.path === "/catalogue" || SERVICE_PATHS.includes(p.path) || isCategory(p) || isSubcategory(p),
  ),
  ...Object.values(PRODUCTS),
  ...Object.values(THEMES),
];

/* ------------------------------------------------------------------ counters */
let blocking = 0;
const samples: Record<string, string[]> = {};
const counts: Record<string, number> = {};
function flag(key: string, page: string, isBlocking = true) {
  counts[key] = (counts[key] || 0) + 1;
  if (isBlocking) blocking++;
  (samples[key] ||= []);
  if (samples[key].length < 5) samples[key].push(page);
}

/* ------------------------------------------------------------------ helpers */
function pageLinkPaths(p: SeoPage): { internal: string[]; total: number } {
  const internal: string[] = [];
  let total = 0;
  const add = (path: string) => {
    if (!path) return;
    total++;
    if (/^https?:\/\//i.test(path)) return; // external — skip
    internal.push(path.split("#")[0] || "/"); // strip anchors
  };
  for (const g of p.internalLinks || []) for (const l of g.links) add(l.path);
  if (p.cta) add(p.cta.path);
  for (const c of p.productGrid?.cards || []) add(c.path);
  for (const b of p.breadcrumb || []) if (b.path) add(b.path);
  return { internal, total };
}

const FAKE_KEYS = ["aggregaterating", "review", "reviews", "ratingvalue"];
function jsonLdIssues(p: SeoPage): { invalid: number; fake: number } {
  let invalid = 0;
  let fake = 0;
  for (const block of p.jsonLd || []) {
    const s = JSON.stringify(block).toLowerCase();
    if (!block || !block["@context"] || !block["@type"]) invalid++;
    if (FAKE_KEYS.some((k) => s.includes(`"${k}"`))) fake++;
    // Product/Offer must never assert an invented price/availability here.
    if (s.includes('"offers"') && (s.includes('"price"') || s.includes('"availability"'))) fake++;
  }
  return { invalid, fake };
}

const PLACEHOLDERS = [/lorem ipsum/i, /\bTODO\b/, /\bFIXME\b/, /xxxx/i, /à compléter/i, /placeholder/i, /undefined/i];
function hasPlaceholder(p: SeoPage): boolean {
  const txt = [p.title, p.description, p.h1, ...(p.intro || []),
    ...(p.sections || []).flatMap((s) => [...(s.paragraphs || []), ...(s.bullets || [])]),
    ...(p.faq || []).flatMap((f) => [f.q, f.a]),
  ].join(" \n ");
  return PLACEHOLDERS.some((re) => re.test(txt));
}

const STOP = new Set(["votre","vos","pour","avec","dans","des","les","une","sur","par","est","aux","plus","tout","tous","nos","notre","cette","chaque","selon","leur","ligne","france","print"]);
function keywordStuffing(p: SeoPage): boolean {
  const text = [...(p.intro || []), p.description].join(" ").toLowerCase()
    .replace(/[^a-zàâäéèêëîïôöùûüç\s]/g, " ");
  const words = text.split(/\s+/).filter((w) => w.length > 4 && !STOP.has(w));
  if (words.length < 30) return false;
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const max = Math.max(...Object.values(freq));
  return max >= 7 && max / words.length > 0.08;
}

/* ------------------------------------------------------------------ checks */
console.log("\n=== AUDIT SEO SÉMANTIQUE — périmètre catalogue ===");
console.log(`Pages auditées : ${CATALOG.length} (catégories + sous-catégories + produits + thèmes + statiques)`);

// Duplicate maps (catalog scope only).
const titleMap: Record<string, string[]> = {};
const descMap: Record<string, string[]> = {};
const h1Map: Record<string, string[]> = {};
const introMap: Record<string, string[]> = {};

for (const p of CATALOG) {
  const id = p.path;

  // Title / description / H1 presence
  if (!p.title || !p.title.trim()) flag("title-missing", id);
  if (!p.description || !p.description.trim()) flag("desc-missing", id);
  if (!p.h1 || !p.h1.trim()) flag("h1-missing", id);

  (titleMap[(p.title || "").trim().toLowerCase()] ||= []).push(id);
  (descMap[(p.description || "").trim().toLowerCase()] ||= []).push(id);
  (h1Map[(p.h1 || "").trim().toLowerCase()] ||= []).push(id);
  (introMap[(p.intro || []).join(" ").trim().toLowerCase()] ||= []).push(id);

  // FAQ presence (categories / subcategories / products must have a visible FAQ)
  const hasFaq = !!(p.faq && p.faq.length);
  const hasFaqLd = (p.jsonLd || []).some((b) => String(b["@type"]).toLowerCase() === "faqpage");
  if ((isCategory(p) || isSubcategory(p) || isProduct(p)) && !hasFaq) flag("faq-missing", id);
  if (hasFaq && !hasFaqLd) flag("faq-visible-without-faqpage", id);
  if (hasFaqLd && !hasFaq) flag("faqpage-without-visible-faq", id);
  // FAQ count ranges
  if (isCategory(p) && hasFaq && (p.faq!.length < 6 || p.faq!.length > 10)) flag("faq-count-category", id, false);
  if (isSubcategory(p) && hasFaq && (p.faq!.length < 5 || p.faq!.length > 8)) flag("faq-count-subcategory", id, false);
  if (isProduct(p) && hasFaq && (p.faq!.length < 3 || p.faq!.length > 6)) flag("faq-count-product", id, false);

  // CTA presence (catalog editorial pages; the /themes index is exempt)
  const isThemeDetail = isTheme(p) && seg(p.path).length === 2;
  if ((isCategory(p) || isSubcategory(p) || isProduct(p) || isThemeDetail) && !p.cta) flag("no-cta", id);

  // Internal links presence + 404
  const { internal } = pageLinkPaths(p);
  if (isProduct(p) && internal.length === 0) flag("product-no-internal-links", id);
  for (const path of internal) {
    if (!ALL_PATHS.has(path)) flag("internal-404", `${id} → ${path}`);
  }

  // Category must link to its subcategories
  if (isCategory(p)) {
    const slug = seg(p.path)[1];
    const subPrefix = `/categorie/${slug}/`;
    const hasSubInScope = Object.keys(PAGES).some((k) => k.startsWith(subPrefix));
    const linksToSub = (p.internalLinks || []).some((g) => g.links.some((l) => l.path.startsWith(subPrefix)));
    if (hasSubInScope && !linksToSub) flag("category-no-sub-links", id);
  }
  // Subcategory must link to its parent category
  if (isSubcategory(p)) {
    const parent = `/categorie/${seg(p.path)[1]}`;
    const linksToParent = (p.internalLinks || []).some((g) => g.links.some((l) => l.path === parent));
    if (!linksToParent) flag("subcategory-no-parent-link", id);
  }

  // Complementary products must point to EXISTING product pages
  const compGroup = (p.internalLinks || []).find((g) => g.heading === "Produits complémentaires");
  if (compGroup) {
    for (const l of compGroup.links) {
      if (!PRODUCTS[l.path]) flag("complementary-inexistant", `${id} → ${l.path}`);
    }
  }

  // JSON-LD validity + fake review/price/availability
  const { invalid, fake } = jsonLdIssues(p);
  if (invalid) flag("jsonld-invalid", id);
  if (fake) flag("fake-data", id);

  // Placeholder phrases
  if (hasPlaceholder(p)) flag("placeholder", id);

  // Keyword stuffing (reported, non-blocking)
  if (keywordStuffing(p)) flag("keyword-stuffing", id, false);
}

// Product-level semantic checks (primary keyword + ≥5 secondary expressions + on-topic)
for (const p of Object.values(PRODUCTS)) {
  const sku = p.path.replace(/^\/products\//, "");
  const seo = getProductSEOData(p.h1 || sku, sku);
  if (!seo.primaryKeyword || !seo.primaryKeyword.trim()) flag("product-no-primary-keyword", p.path);
  if (!seo.secondaryKeywords || seo.secondaryKeywords.length < 5) flag("product-few-secondary", p.path);
  // Off-topic: a detected family must not import a forbidden neighbour's term.
  const fam = detectFamily(p.h1 || sku, sku);
  if (fam) {
    const intro = (p.intro || []).join(" ").toLowerCase();
    const cross = Object.keys(FAMILY_KEYWORDS).filter((k) => k !== fam);
    // light guardrail: bottle must not say "mug", poster must not say "flyer"
    if (fam === "bottle" && /\bmug\b/.test(intro)) flag("off-topic-keyword", p.path, false);
    if ((fam === "affiche") && /\bflyer\b/.test(intro)) flag("off-topic-keyword", p.path, false);
    void cross;
  }
}

// Duplicate aggregation
const dupTitles = Object.values(titleMap).filter((a) => a.length > 1);
const dupDescs = Object.values(descMap).filter((a) => a.length > 1);
const dupH1 = Object.values(h1Map).filter((a) => a.length > 1);
const dupIntro = Object.values(introMap).filter((a) => a.length > 1);
for (const a of dupTitles) flag("dup-title", a.join(" | "), false);
for (const a of dupDescs) flag("dup-desc", a.join(" | "), false);
for (const a of dupH1) flag("dup-h1", a.join(" | "), false);
for (const a of dupIntro) flag("dup-content", a.join(" | "), false);

/* ------------------------------------------------------------------ report */
const n = (k: string) => counts[k] || 0;
console.log("\n--- Rapport chiffré ---");
const lines: [string, number][] = [
  ["Titres manquants", n("title-missing")],
  ["Metas manquantes", n("desc-missing")],
  ["H1 manquants", n("h1-missing")],
  ["Titres dupliqués (groupes)", dupTitles.length],
  ["Metas dupliquées (groupes)", dupDescs.length],
  ["H1 dupliqués (groupes)", dupH1.length],
  ["Contenu dupliqué (intro, groupes)", dupIntro.length],
  ["Pages sans FAQ visible", n("faq-missing")],
  ["FAQ visible sans FAQPage", n("faq-visible-without-faqpage")],
  ["FAQPage sans FAQ visible", n("faqpage-without-visible-faq")],
  ["FAQ catégorie hors plage 6–10", n("faq-count-category")],
  ["FAQ sous-catégorie hors plage 5–8", n("faq-count-subcategory")],
  ["FAQ produit hors plage 3–6", n("faq-count-product")],
  ["Pages sans CTA", n("no-cta")],
  ["Produits sans liens internes", n("product-no-internal-links")],
  ["Catégories sans lien vers sous-catégories", n("category-no-sub-links")],
  ["Sous-catégories sans lien vers la catégorie", n("subcategory-no-parent-link")],
  ["Liens internes 404", n("internal-404")],
  ["Produits complémentaires inexistants", n("complementary-inexistant")],
  ["Produits sans mot-clé principal", n("product-no-primary-keyword")],
  ["Produits < 5 expressions secondaires", n("product-few-secondary")],
  ["JSON-LD invalides", n("jsonld-invalid")],
  ["Faux avis / faux prix / fausse dispo", n("fake-data")],
  ["Phrases placeholder", n("placeholder")],
  ["Mots-clés hors sujet", n("off-topic-keyword")],
  ["Pages avec bourrage de mots-clés", n("keyword-stuffing")],
];
for (const [label, value] of lines) {
  const mark = value === 0 ? "✓" : "✗";
  console.log(`  ${mark} ${label}: ${value}`);
}

// Show a few samples for any non-empty category to help debugging.
const withSamples = Object.keys(samples).filter((k) => counts[k]);
if (withSamples.length) {
  console.log("\n--- Exemples ---");
  for (const k of withSamples) console.log(`  ${k}: ${samples[k].join(" ; ")}${counts[k] > samples[k].length ? " …" : ""}`);
}

console.log("\n" + (blocking === 0 ? "AUDIT SEO OK — 0 anomalie bloquante" : `AUDIT SEO: ${blocking} anomalie(s) bloquante(s)`));
process.exit(blocking === 0 ? 0 : 1);
