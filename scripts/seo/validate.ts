// Automated SEO validation over the in-memory page model (no dist needed).
// Checks: page counts, duplicates, missing H2/H3, required head fields,
// breadcrumb, internal links, visible FAQ, JSON-LD validity, broken internal
// links (potential 404s), PLUS the commercial/enrichment controls:
//  - distinct hero visuals + pages per hero
//  - neighbouring cities sharing the same hero
//  - max editorial similarity between local pages
//  - local pages missing a category / department / region link
//  - local pages missing a CTA
//  - invalid external links
//  - local pages missing the required J2L ecosystem quota
// Usage: bunx tsx scripts/seo/validate.ts
import { buildAllPages } from "./build-pages";
import { loadGeo } from "./geo-data";
import { J2L_ECOSYSTEM } from "../../src/seo/content/local";
import type { SeoPage } from "../../src/seo/types";

// Runtime routes that exist outside the prerendered page set (valid targets).
const RUNTIME_ROUTES = new Set(["/", "/products", "/imprimerie", "/blog", "/cart", "/checkout"]);
const isExternal = (p: string) => /^https?:\/\//.test(p) || p.startsWith("/#");
const ECO_PATHS = new Set(J2L_ECOSYSTEM.map((l) => l.path));

function hasH2(p: SeoPage): boolean {
  return Boolean((p.sections && p.sections.length) || p.productGrid || (p.faq && p.faq.length) || (p.internalLinks && p.internalLinks.length));
}
function hasH3(p: SeoPage): boolean {
  return Boolean((p.productGrid && p.productGrid.cards.length) || (p.faq && p.faq.length));
}
function jsonLdValid(p: SeoPage): boolean {
  try {
    for (const b of p.jsonLd) {
      const o = b as Record<string, unknown>;
      if (!o["@context"] || !o["@type"]) return false;
      if (o["@type"] === "LocalBusiness") return false; // forbidden (no fake address)
      JSON.parse(JSON.stringify(b));
    }
    return true;
  } catch {
    return false;
  }
}

// All internal-link paths declared on a page (link groups only).
function linkPaths(p: SeoPage): string[] {
  const out: string[] = [];
  for (const g of p.internalLinks || []) for (const l of g.links) out.push(l.path);
  return out;
}

// Editorial text used for the similarity measure.
function pageText(p: SeoPage): string {
  const parts: string[] = [...(p.intro || [])];
  for (const s of p.sections || []) {
    parts.push(s.heading);
    parts.push(...(s.paragraphs || []));
    parts.push(...(s.bullets || []));
  }
  for (const f of p.faq || []) {
    parts.push(f.q, f.a);
  }
  return parts.join(" ").toLowerCase().replace(/[^a-zàâäçéèêëîïôöùûü0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function shingles(text: string, n = 3): Set<string> {
  const w = text.split(" ").filter(Boolean);
  const s = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(" "));
  return s;
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const x of small) if (big.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// Max pairwise similarity within a group (returns ratio 0..1 and the pair).
function maxSimilarity(pages: SeoPage[]): { ratio: number; pair: [string, string] } {
  const sigs = pages.map((p) => ({ path: p.path, sh: shingles(pageText(p)) }));
  let best = 0;
  let pair: [string, string] = ["", ""];
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      const r = jaccard(sigs[i].sh, sigs[j].sh);
      if (r > best) {
        best = r;
        pair = [sigs[i].path, sigs[j].path];
      }
    }
  }
  return { ratio: best, pair };
}

async function main() {
  const pages = await buildAllPages();
  const geo = loadGeo();
  const paths = new Set(pages.map((p) => p.path));
  const byPath = new Map(pages.map((p) => [p.path, p]));

  const seg = (p: SeoPage) => p.path.split("/").filter(Boolean);
  const cities = pages.filter((p) => seg(p)[0] === "ville");
  const departments = pages.filter((p) => seg(p)[0] === "departement");
  const regions = pages.filter((p) => seg(p)[0] === "region");
  const local = [...cities, ...departments, ...regions];

  // duplicates
  const counts = new Map<string, number>();
  for (const p of pages) counts.set(p.path, (counts.get(p.path) ?? 0) + 1);
  const duplicates = [...counts.entries()].filter(([, n]) => n > 1);

  const noH1 = pages.filter((p) => !p.h1 || !p.h1.trim());
  const noH2 = pages.filter((p) => !hasH2(p));
  const noH3 = pages.filter((p) => p.path !== "/" && !hasH3(p));
  const noTitle = pages.filter((p) => !p.title || !p.title.trim());
  const noDesc = pages.filter((p) => !p.description || !p.description.trim());
  const noCrumb = pages.filter((p) => !p.breadcrumb || !p.breadcrumb.length);
  const noLinks = pages.filter((p) => p.path !== "/" && (!p.internalLinks || !p.internalLinks.length));
  const badLd = pages.filter((p) => !jsonLdValid(p));

  // broken internal links (potential 404)
  const broken: string[] = [];
  for (const p of pages) {
    const groups = [...(p.internalLinks || []), ...(p.cta ? [{ heading: "", links: [{ label: p.cta.label, path: p.cta.path }] }] : [])];
    for (const g of groups) {
      for (const l of g.links) {
        if (isExternal(l.path)) continue;
        const target = l.path.replace(/\/$/, "") || "/";
        if (!paths.has(target) && !RUNTIME_ROUTES.has(target)) broken.push(`${p.path} -> ${l.path}`);
      }
    }
    for (const b of p.breadcrumb) {
      if (isExternal(b.path)) continue;
      const target = b.path.replace(/\/$/, "") || "/";
      if (!paths.has(target) && !RUNTIME_ROUTES.has(target)) broken.push(`${p.path} (crumb) -> ${b.path}`);
    }
  }

  // invalid external links (bad URL / non-https)
  const badExternal: string[] = [];
  for (const p of pages) {
    const ext = [...(p.externalLinks || []), ...linkPaths(p).filter((x) => /^https?:\/\//.test(x)).map((x) => ({ path: x }))];
    for (const l of ext) {
      try {
        const u = new URL(l.path);
        if (u.protocol !== "https:") badExternal.push(`${p.path} -> ${l.path}`);
      } catch {
        badExternal.push(`${p.path} -> ${l.path}`);
      }
    }
  }

  // ── hero distribution ──
  const heroOf = new Map<string, string>();
  const heroCount = new Map<string, number>();
  for (const p of local) {
    const img = p.hero?.image || "(none)";
    heroOf.set(p.path, img);
    heroCount.set(img, (heroCount.get(img) ?? 0) + 1);
  }
  const distinctHeroes = [...heroCount.keys()].filter((k) => k !== "(none)").length;

  // neighbouring cities sharing the same hero
  let neighborSameHero = 0;
  const seenPair = new Set<string>();
  for (const gc of geo.cities) {
    const a = `/ville/${gc.slug}`;
    const ha = heroOf.get(a);
    if (!ha) continue;
    for (const ns of gc.nearbyCitySlugs || []) {
      const b = `/ville/${ns}`;
      if (!heroOf.has(b)) continue;
      const key = [gc.slug, ns].sort().join("|");
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      if (heroOf.get(b) === ha) neighborSameHero++;
    }
  }

  // ── editorial variants (distinct intro signatures) ──
  const introSig = new Set(local.map((p) => (p.intro || []).join(" ")));

  // ── max similarity between local pages (by type) ──
  const simCities = maxSimilarity(cities);
  const simDepts = maxSimilarity(departments);
  const simRegions = maxSimilarity(regions);
  const simMax = [simCities, simDepts, simRegions].reduce((a, b) => (b.ratio > a.ratio ? b : a));

  // ── link-quota controls on local pages ──
  const noCategoryLink = local.filter((p) => !linkPaths(p).some((x) => x.startsWith("/categorie/")));
  const noDeptLink = cities.filter((p) => !linkPaths(p).some((x) => x.startsWith("/departement/")));
  const noRegionLink = [...cities, ...departments].filter((p) => !linkPaths(p).some((x) => x.startsWith("/region/")));
  const noCta = local.filter((p) => !p.cta || !p.cta.label);

  // ── ecosystem quota (villes>=1, departements>=2, regions>=4) ──
  const ecoCount = (p: SeoPage) => linkPaths(p).filter((x) => ECO_PATHS.has(x)).length;
  const missingEcoCity = cities.filter((p) => ecoCount(p) < 1);
  const missingEcoDept = departments.filter((p) => ecoCount(p) < 2);
  const missingEcoRegion = regions.filter((p) => ecoCount(p) < 4);
  const totalEcoLinks = local.reduce((n, p) => n + ecoCount(p), 0);

  console.log("=== SEO VALIDATION ===");
  console.log("pages villes:", cities.length);
  console.log("pages départements:", departments.length);
  console.log("pages régions:", regions.length);
  console.log("total pages:", pages.length);
  console.log("doublons:", duplicates.length, duplicates.map(([u, n]) => `${u} x${n}`).join(", "));
  console.log("404 (liens internes cassés):", broken.length);
  if (broken.length) console.log("  ", broken.slice(0, 20).join("\n   "));
  console.log("liens externes invalides:", badExternal.length, badExternal.slice(0, 10).join(", "));
  console.log("pages sans H1:", noH1.length);
  console.log("pages sans H2:", noH2.length);
  console.log("pages sans H3 (hors accueil):", noH3.length);
  console.log("pages sans title:", noTitle.length);
  console.log("pages sans meta description:", noDesc.length);
  console.log("pages sans fil d'Ariane:", noCrumb.length);
  console.log("pages sans liens internes (hors accueil):", noLinks.length);
  console.log("JSON-LD invalides:", badLd.length, badLd.slice(0, 10).map((p) => p.path).join(", "));

  console.log("\n=== ENRICHISSEMENT ===");
  console.log("visuels hero différents:", distinctHeroes);
  console.log("répartition des pages par hero:");
  for (const [img, n] of [...heroCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${img}: ${n}`);
  }
  console.log("pages voisines avec hero identique:", neighborSameHero);
  console.log("variantes éditoriales (intros distinctes):", introSig.size);
  console.log("taux de similarité max (villes):", (simCities.ratio * 100).toFixed(1) + "%", simCities.pair.join(" ~ "));
  console.log("taux de similarité max (départements):", (simDepts.ratio * 100).toFixed(1) + "%", simDepts.pair.join(" ~ "));
  console.log("taux de similarité max (régions):", (simRegions.ratio * 100).toFixed(1) + "%", simRegions.pair.join(" ~ "));
  console.log("taux de similarité MAX local:", (simMax.ratio * 100).toFixed(1) + "%", simMax.pair.join(" ~ "));
  console.log("pages sans lien catégorie:", noCategoryLink.length);
  console.log("pages villes sans lien département:", noDeptLink.length);
  console.log("pages sans lien région:", noRegionLink.length);
  console.log("pages sans CTA:", noCta.length);
  console.log("liens écosystème ajoutés (total):", totalEcoLinks);
  console.log("villes sous quota écosystème (<1):", missingEcoCity.length);
  console.log("départements sous quota écosystème (<2):", missingEcoDept.length);
  console.log("régions sous quota écosystème (<4):", missingEcoRegion.length);

  const anomalies =
    duplicates.length + broken.length + badExternal.length + noH1.length + noH2.length + noH3.length +
    noTitle.length + noDesc.length + noCrumb.length + noLinks.length + badLd.length +
    noCategoryLink.length + noDeptLink.length + noRegionLink.length + noCta.length +
    missingEcoCity.length + missingEcoDept.length + missingEcoRegion.length;
  console.log("\n=== ANOMALIES:", anomalies, "===");
  process.exit(anomalies > 0 ? 1 : 0);
}

main();
