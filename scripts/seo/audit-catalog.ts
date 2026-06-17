/**
 * Automated catalogue audit (supplier corrections).
 * Run with:  bun scripts/seo/audit-catalog.ts
 *
 * Checks the corrections that can be verified statically / from pure logic:
 *  - no marketing placeholder left in product copy
 *  - search synonyms & typo tolerance
 *  - product-copy family guardrails (bottle≠mug, poster≠flyer, …)
 *  - excluded products & old-slug redirects
 *  - no public Print.com mention in the frontend source
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { searchProducts, scoreProduct } from "../../src/lib/search";
import { getProductSEOData } from "../../src/lib/product-seo";
import { EXCLUDED_SKUS, getSlugRedirect, isUnavailableSku } from "../../src/config/excluded-products";

let failures = 0;
const ok = (m: string) => console.log("  ✓ " + m);
const ko = (m: string) => {
  failures++;
  console.log("  ✗ " + m);
};

// 1 — Placeholder text gone from product copy source
console.log("\n[1] Placeholders / contenu générique");
{
  const src = readFileSync("src/lib/product-seo.ts", "utf8");
  if (!/Faites confiance à J2L/.test(src)) ok("aucun bloc marketing générique 'Faites confiance…'");
  else ko("placeholder 'Faites confiance…' encore présent dans product-seo.ts");
  const generic = getProductSEOData("Produit inconnu xyz", "produit-inconnu-xyz");
  if (generic.intro.length < 400) ok("fallback court et factuel pour produit sans famille");
  else ko("fallback générique trop long");
}

// 2 — Search synonyms + typo tolerance
console.log("\n[2] Moteur de recherche (synonymes + fautes)");
{
  const catalog = [
    { sku: "flyers", name: "Flyers" },
    { sku: "posters", name: "Affiches" },
    { sku: "banners", name: "Bâches banderoles" },
    { sku: "stickers", name: "Autocollants" },
    { sku: "businesscards", name: "Cartes de visite" },
    { sku: "rollup", name: "Roll-up kakémono" },
    { sku: "tshirt", name: "T-shirt textile" },
    { sku: "glacier-drinking-bottle", name: "Gourde Glacier" },
  ];
  const cases: [string, string][] = [
    ["flyer", "flyers"],
    ["prospectus", "flyers"],
    ["autocolant", "stickers"],
    ["autocollants", "stickers"],
    ["kakemono", "rollup"],
    ["banderolle", "banners"],
    ["carte visite", "businesscards"],
    ["tee shirt", "tshirt"],
    ["bouteille", "glacier-drinking-bottle"],
    ["poster", "posters"],
  ];
  for (const [q, expected] of cases) {
    const top = searchProducts(catalog, q, 3)[0];
    if (top && top.sku === expected) ok(`« ${q} » → ${expected}`);
    else ko(`« ${q} » → attendu ${expected}, obtenu ${top?.sku ?? "rien"}`);
  }
  // "mug" must NOT surface a bottle as top hit
  const mugTop = searchProducts(catalog, "mug", 3)[0];
  if (!mugTop || mugTop.sku !== "glacier-drinking-bottle") ok("« mug » ne renvoie pas la bouteille en tête");
  else ko("« mug » renvoie la bouteille");
}

// 3 — Product copy guardrails
console.log("\n[3] Garde-fous descriptions (pas de contamination)");
{
  const bottle = getProductSEOData("Gourde Glacier", "glacier-drinking-bottle");
  if (/bouteille|gourde/i.test(bottle.intro) && !/\bmug\b/i.test(bottle.intro)) ok("bouteille → texte bouteille, pas de mug");
  else ko("bouteille → texte incorrect (mug détecté)");

  const poster = getProductSEOData("Affiches", "posters");
  if (/affiche|poster/i.test(poster.intro) && !/\bflyer\b/i.test(poster.intro)) ok("poster → texte affiche, pas de flyer");
  else ko("poster → texte incorrect (flyer détecté)");

  const bag = getProductSEOData("Tote bag coton", "tote-bag");
  if (/sac/i.test(bag.intro) && !/brochure|d.pliant/i.test(bag.intro)) ok("bag → texte sac, pas de brochure");
  else ko("bag → texte incorrect (brochure détecté)");

  const mug = getProductSEOData("Mug céramique", "mug");
  if (/mug/i.test(mug.intro)) ok("mug → texte mug");
  else ko("mug → texte incorrect");
}

// 4 — Exclusions & redirects
console.log("\n[4] Produits exclus & redirections");
{
  if (EXCLUDED_SKUS.has("election-posters-fr")) ok("election-posters-fr exclu du catalogue public");
  else ko("election-posters-fr non exclu");
  if (getSlugRedirect("election-posters-fr") === "posters") ok("election-posters-fr → 301 /products/posters");
  else ko("redirection election-posters-fr manquante");
  if (!isUnavailableSku("election-posters-fr")) ok("election-posters-fr a une cible (pas page indisponible)");
  else ko("election-posters-fr marqué indisponible alors qu'une redirection existe");
}

// 5 — No public Print.com mention in frontend source
console.log("\n[5] Marque blanche (0 mention publique Print.com)");
{
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const s = statSync(p);
      if (s.isDirectory()) {
        if (/integrations|node_modules/.test(p)) continue;
        walk(p);
      } else if (/\.(tsx?|html)$/.test(p)) {
        const lines = readFileSync(p, "utf8").split("\n");
        lines.forEach((line, i) => {
          if (!/print\.com/i.test(line)) return;
          const trimmed = line.trim();
          // ignore comments and console logs (private, not user-visible)
          if (/^(\/\/|\/\*|\*)/.test(trimmed)) return;
          if (/console\.(log|warn|error|info)/.test(line)) return;
          offenders.push(`${p}:${i + 1}`);
        });
      }
    }
  };
  walk("src");
  if (offenders.length === 0) ok("aucune mention publique Print.com dans src/");
  else offenders.forEach((o) => ko("mention Print.com: " + o));
}

console.log("\n" + (failures === 0 ? "AUDIT OK — 0 échec" : `AUDIT: ${failures} échec(s)`));
process.exit(failures === 0 ? 0 : 1);
