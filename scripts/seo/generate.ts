// Single SEO build step (predev/prebuild):
//  1. buildAllPages() — the one source of truth
//  2. writes src/seo/generated/pages.json (imported by the React routes
//     so the runtime render is byte-for-byte the prerendered content)
//  3. writes the multi-file sitemap containing ONLY these live pages
//     (no old URLs, no products yet, no noindex pages).
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { buildAllPages, buildProductPages, buildThemePages } from "./build-pages";
import { loadGeo } from "./geo-data";
import type { SeoPage } from "../../src/seo/types";

const BASE_URL = "https://j2lprint.fr";
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Service pages that already exist as real, published React routes.
const SERVICE_PATHS = [
  "/impression-numerique",
  "/grand-format",
  "/supports-publicitaires",
  "/personnalisation",
];

interface Entry { path: string; priority: string; changefreq: string }

function urlset(entries: Entry[]): string {
  const urls = entries.map((e) => [
    "  <url>",
    `    <loc>${BASE_URL}${e.path}</loc>`,
    `    <lastmod>${BUILD_DATE}</lastmod>`,
    `    <changefreq>${e.changefreq}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    "  </url>",
  ].join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function index(files: string[]): string {
  const items = files.map((f) => [
    "  <sitemap>",
    `    <loc>${BASE_URL}/sitemaps/${f}</loc>`,
    `    <lastmod>${BUILD_DATE}</lastmod>`,
    "  </sitemap>",
  ].join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

function group(pages: SeoPage[]) {
  const indexable = pages.filter((p) => !p.noindex);
  const is = (p: SeoPage, pred: (seg: string[]) => boolean) => pred(p.path.split("/").filter(Boolean));
  return {
    static: indexable.filter((p) => p.path === "/" || p.path === "/catalogue").map((p) => p.path)
      .concat(SERVICE_PATHS),
    categories: indexable.filter((p) => is(p, (s) => s[0] === "categorie" && s.length === 2)).map((p) => p.path),
    subcategories: indexable.filter((p) => is(p, (s) => s[0] === "categorie" && s.length === 3)).map((p) => p.path),
    cities: indexable.filter((p) => is(p, (s) => s[0] === "ville")).map((p) => p.path),
    departments: indexable.filter((p) => is(p, (s) => s[0] === "departement")).map((p) => p.path),
    regions: indexable.filter((p) => is(p, (s) => s[0] === "region")).map((p) => p.path),
  };
}

/** Regenerate the geographic arrays + the product slug list in the Cloudflare
 *  worker so its SEO-managed set matches EXACTLY the prerendered pages (no
 *  product served via the SPA fallback). Leaves all worker logic untouched —
 *  only the data lines are replaced. */
function syncWorker(productSlugs: string[], themeSlugs: string[]) {
  const wp = resolve("public/cloudflare-worker-j2lprint.js");
  if (!existsSync(wp)) return;
  const geo = loadGeo();
  const arr = (xs: string[]) => `[${xs.slice().sort().map((s) => `"${s}"`).join(",")}]`;
  const cities = arr(geo.cities.map((c) => c.slug));
  const departments = arr(geo.departments.map((d) => d.slug));
  const regions = arr(geo.regions.map((r) => r.slug));
  const products = arr(productSlugs);
  const themes = arr(themeSlugs);
  let src = readFileSync(wp, "utf8");
  src = src
    .replace(/const CITIES=\[[^\]]*\];/, `const CITIES=${cities};`)
    .replace(/const DEPARTMENTS=\[[^\]]*\];/, `const DEPARTMENTS=${departments};`)
    .replace(/const REGIONS=\[[^\]]*\];/, `const REGIONS=${regions};`)
    .replace(/const THEMES\s*=\s*\[[\s\S]*?\];/, `const THEMES = ${themes};`)
    .replace(/const PRODUCTS\s*=\s*\[[\s\S]*?\];/, `const PRODUCTS = ${products};`);
  writeFileSync(wp, src);
  console.log(
    `Worker synced: cities=${geo.cities.length} departments=${geo.departments.length} regions=${geo.regions.length} themes=${themeSlugs.length} products=${productSlugs.length}`,
  );
}

async function main() {
  const pages = await buildAllPages();

  // 1. pages.json for the runtime React routes
  const genDir = resolve("src/seo/generated");
  mkdirSync(genDir, { recursive: true });
  const byPath: Record<string, SeoPage> = {};
  for (const p of pages) byPath[p.path] = p;
  writeFileSync(resolve(genDir, "pages.json"), JSON.stringify(byPath, null, 0));

  // 1b. product pages — prerendered separately (products.json) so the runtime
  //     React bundle is NOT bloated with ~940 entries. Only the build-time
  //     prerenderer reads this file. Never affects prices/API/configurator.
  const productPages = await buildProductPages();
  const productsByPath: Record<string, SeoPage> = {};
  for (const p of productPages) productsByPath[p.path] = p;
  writeFileSync(resolve(genDir, "products.json"), JSON.stringify(productsByPath, null, 0));
  const productSlugs = productPages.map((p) => p.path.replace(/^\/products\//, ""));

  // 1c. theme pages — /themes + /themes/:slug, prerendered separately
  //     (themes.json) for the same reason as products. Never affects the
  //     runtime /themes routes, prices, API, configurator or mappings.
  const themePages = await buildThemePages();
  const themesByPath: Record<string, SeoPage> = {};
  for (const p of themePages) themesByPath[p.path] = p;
  writeFileSync(resolve(genDir, "themes.json"), JSON.stringify(themesByPath, null, 0));
  const themeSlugs = themePages
    .map((p) => p.path.replace(/^\/themes\//, ""))
    .filter((s) => s && s !== "/themes" && !s.startsWith("/"));

  // 2. sitemaps — only these live, indexable pages
  const dir = resolve("public/sitemaps");
  mkdirSync(dir, { recursive: true });
  const g = group(pages);
  const files: string[] = [];
  const write = (name: string, paths: string[], priority: string, freq: string) => {
    if (!paths.length) return;
    writeFileSync(resolve(dir, name), urlset(paths.map((path) => ({ path, priority, changefreq: freq }))));
    files.push(name);
  };
  write("static.xml", g.static, "0.9", "weekly");
  write("categories.xml", g.categories, "0.8", "weekly");
  write("subcategories.xml", g.subcategories, "0.7", "weekly");
  write("themes.xml", themePages.map((p) => p.path), "0.6", "weekly");
  write("products.xml", productPages.map((p) => p.path), "0.7", "weekly");
  write("cities.xml", g.cities, "0.6", "monthly");
  write("departments.xml", g.departments, "0.5", "monthly");
  write("regions.xml", g.regions, "0.6", "monthly");
  writeFileSync(resolve("public/sitemap.xml"), index(files));

  // 3. keep the Cloudflare worker geographic + product + theme arrays in sync
  syncWorker(productSlugs, themeSlugs);

  console.log(`SEO build: ${pages.length} pages + ${productPages.length} products + ${themePages.length} themes`);
  console.log(`Sitemaps: static=${g.static.length} categories=${g.categories.length} subcategories=${g.subcategories.length} themes=${themePages.length} products=${productPages.length} cities=${g.cities.length} departments=${g.departments.length} regions=${g.regions.length}`);
}

main();
