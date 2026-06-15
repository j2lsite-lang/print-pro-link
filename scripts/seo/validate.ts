// Automated SEO validation over the in-memory page model (no dist needed).
// Checks: page counts, duplicates, missing H2/H3, required head fields,
// breadcrumb, internal links, visible FAQ, JSON-LD validity, no fake
// LocalBusiness, and broken internal links (potential 404s).
// Usage: bunx tsx scripts/seo/validate.ts
import { buildAllPages } from "./build-pages";
import type { SeoPage } from "../../src/seo/types";

// Runtime routes that exist outside the prerendered page set (valid targets).
const RUNTIME_ROUTES = new Set(["/", "/products", "/imprimerie", "/blog", "/cart", "/checkout"]);
const isExternal = (p: string) => /^https?:\/\//.test(p) || p.startsWith("/#");

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

async function main() {
  const pages = await buildAllPages();
  const paths = new Set(pages.map((p) => p.path));

  const seg = (p: SeoPage) => p.path.split("/").filter(Boolean);
  const cities = pages.filter((p) => seg(p)[0] === "ville");
  const departments = pages.filter((p) => seg(p)[0] === "departement");
  const regions = pages.filter((p) => seg(p)[0] === "region");

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

  console.log("=== SEO VALIDATION ===");
  console.log("pages villes:", cities.length);
  console.log("pages départements:", departments.length);
  console.log("pages régions:", regions.length);
  console.log("total pages:", pages.length);
  console.log("doublons:", duplicates.length, duplicates.map(([u, n]) => `${u} x${n}`).join(", "));
  console.log("404 (liens internes cassés):", broken.length);
  if (broken.length) console.log("  ", broken.slice(0, 20).join("\n   "));
  console.log("pages sans H1:", noH1.length);
  console.log("pages sans H2:", noH2.length);
  console.log("pages sans H3 (hors accueil):", noH3.length);
  console.log("pages sans title:", noTitle.length);
  console.log("pages sans meta description:", noDesc.length);
  console.log("pages sans fil d'Ariane:", noCrumb.length);
  console.log("pages sans liens internes (hors accueil):", noLinks.length);
  console.log("JSON-LD invalides:", badLd.length, badLd.slice(0, 10).map((p) => p.path).join(", "));

  const anomalies =
    duplicates.length + broken.length + noH1.length + noH2.length + noH3.length +
    noTitle.length + noDesc.length + noCrumb.length + noLinks.length + badLd.length;
  console.log("\n=== ANOMALIES:", anomalies, "===");
  process.exit(anomalies > 0 ? 1 : 0);
}

main();
