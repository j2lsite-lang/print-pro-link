// Single SEO build step (predev/prebuild):
//  1. buildAllPages() — the one source of truth
//  2. writes src/seo/generated/pages.json (imported by the React routes
//     so the runtime render is byte-for-byte the prerendered content)
//  3. writes the multi-file sitemap containing ONLY these live pages
//     (no old URLs, no products yet, no noindex pages).
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { buildAllPages } from "./build-pages";
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
    products: indexable.filter((p) => is(p, (s) => s[0] === "products" && s.length === 2)).map((p) => p.path),
    cities: indexable.filter((p) => is(p, (s) => s[0] === "ville")).map((p) => p.path),
    departments: indexable.filter((p) => is(p, (s) => s[0] === "departement")).map((p) => p.path),
  };
}

async function main() {
  const pages = await buildAllPages();

  // 1. pages.json for the runtime React routes
  const genDir = resolve("src/seo/generated");
  mkdirSync(genDir, { recursive: true });
  const byPath: Record<string, SeoPage> = {};
  for (const p of pages) byPath[p.path] = p;
  writeFileSync(resolve(genDir, "pages.json"), JSON.stringify(byPath, null, 0));

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
  write("products.xml", g.products, "0.8", "weekly");
  write("cities.xml", g.cities, "0.6", "monthly");
  write("departments.xml", g.departments, "0.5", "monthly");
  writeFileSync(resolve("public/sitemap.xml"), index(files));

  console.log(`SEO build: ${pages.length} pages → pages.json`);
  console.log(`Sitemaps: static=${g.static.length} categories=${g.categories.length} subcategories=${g.subcategories.length} products=${g.products.length} cities=${g.cities.length} departments=${g.departments.length}`);
}

main();
