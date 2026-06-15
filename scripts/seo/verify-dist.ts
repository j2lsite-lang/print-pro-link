/**
 * Contrôle automatique SEO : compare les URLs des sitemaps avec les fichiers
 * HTML réellement pré-rendus dans dist/. Échoue si une URL du sitemap n'a pas
 * de fichier HTML correspondant.
 *
 * Usage: bunx tsx scripts/seo/verify-dist.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const DIST = resolve("dist");
const SITEMAP_DIR = join(DIST, "sitemaps");
const BASE = "https://j2lprint.fr";

const SUB_SITEMAPS = [
  "static.xml",
  "categories.xml",
  "subcategories.xml",
  "cities.xml",
  "departments.xml",
  "regions.xml",
];

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function urlToPath(url: string): string {
  let p = url.replace(BASE, "");
  if (p === "" || p === "/") return "/";
  // strip trailing slash
  p = p.replace(/\/$/, "");
  return p;
}

function expectedHtmlFile(path: string): string {
  if (path === "/") return join(DIST, "index.html");
  return join(DIST, path.replace(/^\//, ""), "index.html");
}

// 1. Vérifier index sitemap
console.log("=== Sitemap index ===");
console.log("dist/sitemap.xml:", existsSync(join(DIST, "sitemap.xml")) ? "OK" : "MANQUANT");
for (const s of SUB_SITEMAPS) {
  console.log(`dist/sitemaps/${s}:`, existsSync(join(SITEMAP_DIR, s)) ? "OK" : "MANQUANT");
}

// 2. Collecter toutes les URLs
const allUrls: { url: string; sitemap: string }[] = [];
for (const s of SUB_SITEMAPS) {
  const file = join(SITEMAP_DIR, s);
  if (!existsSync(file)) continue;
  for (const loc of extractLocs(readFileSync(file, "utf8"))) {
    allUrls.push({ url: loc, sitemap: s });
  }
}

// 3. Doublons
const seen = new Map<string, number>();
for (const { url } of allUrls) seen.set(url, (seen.get(url) ?? 0) + 1);
const duplicates = [...seen.entries()].filter(([, n]) => n > 1);

// 4. URLs sitemap sans fichier HTML
const missing: { url: string; expected: string; sitemap: string }[] = [];
const htmlPathsFromSitemap = new Set<string>();
for (const { url, sitemap } of allUrls) {
  const path = urlToPath(url);
  const file = expectedHtmlFile(path);
  htmlPathsFromSitemap.add(file);
  if (!existsSync(file)) missing.push({ url, expected: file, sitemap });
}

// 5. Fichiers HTML dans dist absents du sitemap
import { readdirSync, statSync } from "fs";
function walkHtml(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "assets") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkHtml(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}
const distHtml = walkHtml(DIST);
// fichiers qui ne sont pas la shell SPA générique racine
const htmlNotInSitemap = distHtml.filter((f) => !htmlPathsFromSitemap.has(f));

// === RAPPORT ===
console.log("\n=== RAPPORT ===");
console.log("URLs sitemap (total):", allUrls.length);
console.log("Fichiers HTML dist (total):", distHtml.length);
console.log("\nURLs sitemap SANS fichier HTML pré-rendu:", missing.length);
for (const m of missing) console.log(`  [${m.sitemap}] ${m.url} -> attendu ${m.expected.replace(DIST, "dist")}`);
console.log("\nFichiers HTML dist ABSENTS du sitemap:", htmlNotInSitemap.length);
for (const f of htmlNotInSitemap) console.log(`  ${f.replace(DIST, "dist")}`);
console.log("\nDoublons sitemap:", duplicates.length);
for (const [u, n] of duplicates) console.log(`  ${u} x${n}`);

const anomalies = missing.length + duplicates.length;
console.log("\n=== ANOMALIES (URL sitemap sans HTML + doublons):", anomalies, "===");
process.exit(anomalies > 0 ? 1 : 0);
