/**
 * Dynamic sitemap generator — runs at predev/prebuild (via tsx).
 * Produces a sitemap index + per-type sub-sitemaps under public/.
 *
 * Rules enforced:
 *  - only real, indexable, HTTP-200 routes
 *  - empty subcategories excluded
 *  - no cart/checkout/account/auth/admin
 *  - lastmod uses the build date (real date, not fabricated per-URL)
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://j2lprint.fr";
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ── Phase 1 published locations (validated only) ──
const PRIORITY_CITIES = [
  "epinal", "nancy", "metz", "strasbourg", "colmar", "mulhouse",
  "reims", "troyes", "saint-die-des-vosges", "remiremont", "neufchateau",
  "luneville", "thionville", "sarreguemines", "verdun", "chaumont",
];
const PRIORITY_DEPARTMENTS = [
  "vosges", "meurthe-et-moselle", "moselle", "bas-rhin", "haut-rhin",
  "haute-saone", "meuse", "marne", "aube", "haute-marne",
];

// ── Read Supabase creds from .env (tsx does not auto-load) ──
function readEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const ENV = readEnv();
const SUPABASE_URL = ENV.VITE_SUPABASE_URL;
const ANON = ENV.VITE_SUPABASE_PUBLISHABLE_KEY;

async function rest<T = any>(path: string): Promise<T[]> {
  if (!SUPABASE_URL || !ANON) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

interface Entry { path: string; priority: string; changefreq: string }

function buildUrlset(entries: Entry[]): string {
  const urls = entries
    .map((e) =>
      [
        "  <url>",
        `    <loc>${BASE_URL}${e.path}</loc>`,
        `    <lastmod>${BUILD_DATE}</lastmod>`,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
        "  </url>",
      ].join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildIndex(files: string[]): string {
  const items = files
    .map((f) =>
      [
        "  <sitemap>",
        `    <loc>${BASE_URL}/sitemaps/${f}</loc>`,
        `    <lastmod>${BUILD_DATE}</lastmod>`,
        "  </sitemap>",
      ].join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

async function main() {
  const pub = resolve("public");
  const dir = resolve("public/sitemaps");
  mkdirSync(dir, { recursive: true });

  // Static / service pages
  const staticEntries: Entry[] = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/products", priority: "0.9", changefreq: "weekly" },
    { path: "/impression-numerique", priority: "0.9", changefreq: "monthly" },
    { path: "/grand-format", priority: "0.9", changefreq: "monthly" },
    { path: "/supports-publicitaires", priority: "0.9", changefreq: "monthly" },
    { path: "/personnalisation", priority: "0.9", changefreq: "monthly" },
    { path: "/blog", priority: "0.7", changefreq: "weekly" },
    { path: "/livraison", priority: "0.6", changefreq: "monthly" },
    { path: "/imprimerie", priority: "0.6", changefreq: "monthly" },
  ];

  // Categories + subcategories
  const cats = await rest<{ id: string; slug: string; parent_id: string | null }>(
    "product_categories?select=id,slug,parent_id",
  );
  const mappings = await rest<{ sku: string; category_id: string }>(
    "product_category_mappings?select=sku,category_id",
  );
  const skuByCat = new Map<string, Set<string>>();
  for (const m of mappings) {
    if (!skuByCat.has(m.category_id)) skuByCat.set(m.category_id, new Set());
    skuByCat.get(m.category_id)!.add(m.sku);
  }
  const childrenOf = new Map<string, string[]>();
  for (const c of cats) if (c.parent_id) {
    if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
    childrenOf.get(c.parent_id)!.push(c.id);
  }
  function catSkuCount(id: string): number {
    const ids = [id, ...(childrenOf.get(id) || [])];
    const s = new Set<string>();
    for (const cid of ids) for (const sku of skuByCat.get(cid) || []) s.add(sku);
    return s.size;
  }

  const categoryEntries: Entry[] = cats
    .filter((c) => !c.parent_id && catSkuCount(c.id) > 0)
    .map((c) => ({ path: `/products/category/${c.slug}`, priority: "0.8", changefreq: "weekly" }));

  const subcategoryEntries: Entry[] = cats
    .filter((c) => c.parent_id && (skuByCat.get(c.id)?.size || 0) > 0) // exclude empty subcats
    .map((c) => ({ path: `/products/category/${c.slug}`, priority: "0.7", changefreq: "weekly" }));

  // Products (distinct SKUs that are mapped)
  const skuSet = new Set(mappings.map((m) => m.sku));
  const productEntries: Entry[] = [...skuSet]
    .sort()
    .map((sku) => ({ path: `/products/${sku}`, priority: "0.6", changefreq: "weekly" }));

  // Cities (priority only) + departments
  const cityEntries: Entry[] = PRIORITY_CITIES.map((s) => ({
    path: `/imprimerie/${s}`, priority: "0.6", changefreq: "monthly",
  }));
  const departmentEntries: Entry[] = PRIORITY_DEPARTMENTS.map((s) => ({
    path: `/departement/${s}`, priority: "0.5", changefreq: "monthly",
  }));

  // Guides — none published yet in phase 1
  const guideEntries: Entry[] = [];

  // Split products if > 45000
  const productChunks: Entry[][] = [];
  for (let i = 0; i < productEntries.length; i += 45000)
    productChunks.push(productEntries.slice(i, i + 45000));

  const files: string[] = [];
  const write = (name: string, entries: Entry[]) => {
    if (entries.length === 0) return;
    writeFileSync(resolve(dir, name), buildUrlset(entries));
    files.push(name);
  };

  write("static.xml", staticEntries);
  write("categories.xml", categoryEntries);
  write("subcategories.xml", subcategoryEntries);
  productChunks.forEach((chunk, i) => write(`products-${i + 1}.xml`, chunk));
  write("cities.xml", cityEntries);
  write("departments.xml", departmentEntries);
  write("guides.xml", guideEntries);

  writeFileSync(resolve(pub, "sitemap.xml"), buildIndex(files));

  console.log("Sitemap generated:");
  console.log(`  index → ${files.length} sub-sitemaps`);
  console.log(`  static=${staticEntries.length} categories=${categoryEntries.length} subcategories=${subcategoryEntries.length}`);
  console.log(`  products=${productEntries.length} (${productChunks.length} file(s)) cities=${cityEntries.length} departments=${departmentEntries.length}`);
}

main();
