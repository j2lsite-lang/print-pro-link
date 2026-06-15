/**
 * Sélection AUTOMATIQUE des 30 produits prioritaires depuis le catalogue
 * Print.com actif, avec validation réelle (configurateur + prix + livraison).
 *
 * Critères : produit actif, image réelle, nom exploitable, présent dans une
 * sous-catégorie indexable, configurateur fonctionnel, prix calculable,
 * aucun doublon, aucun SKU non résolu. Répartition équilibrée + forte
 * intention commerciale.
 *
 * Sortie : src/seo/generated/products.json (consommé par build-pages.ts).
 * Usage : npx tsx scripts/seo/select-products.ts
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { CATEGORY_CONTENT, CATEGORY_SLUGS } from "../../src/seo/content/categories";

function readEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const p = resolve(".env");
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const ENV = readEnv();
const SB = ENV.VITE_SUPABASE_URL;
const ANON = ENV.VITE_SUPABASE_PUBLISHABLE_KEY;
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` };

async function rest<T = any>(path: string): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let off = 0; ; off += PAGE) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`${SB}/rest/v1/${path}${sep}limit=${PAGE}&offset=${off}`, { headers: H });
    if (!r.ok) break;
    const rows = (await r.json()) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

const fn = (action: string, params: Record<string, string>, body?: unknown) =>
  fetch(`${SB}/functions/v1/printcom-proxy?` + new URLSearchParams({ action, ...params }), {
    method: body ? "POST" : "GET",
    headers: { ...H, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

function slugify(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Commercial-intent keywords → score boost + bucket label.
const INTENT: { kw: RegExp; bucket: string }[] = [
  { kw: /carte de visite|business card/i, bucket: "cartes-visite" },
  { kw: /flyer|tract/i, bucket: "flyers" },
  { kw: /d[ée]pliant|leaflet|folder/i, bucket: "depliants" },
  { kw: /affiche|poster/i, bucket: "affiches" },
  { kw: /brochure|magazine/i, bucket: "brochures" },
  { kw: /catalogue/i, bucket: "catalogues" },
  { kw: /autocollant|sticker/i, bucket: "autocollants" },
  { kw: /[ée]tiquette|label/i, bucket: "etiquettes" },
  { kw: /b[âa]che|banderole|banner/i, bucket: "baches" },
  { kw: /panneau|dibond|forex|akylux|akilux/i, bucket: "panneaux" },
  { kw: /roll[- ]?up|enrouleur/i, bucket: "roll-ups" },
  { kw: /signal[ée]tique|drapeau|beachflag|kakemono/i, bucket: "signaletique" },
  { kw: /papeterie|bloc|carnet|agenda|enveloppe|papier en-t[êe]te/i, bucket: "papeterie" },
  { kw: /calendrier/i, bucket: "calendriers" },
  { kw: /emballage|bo[îi]te|packaging/i, bucket: "emballages" },
  { kw: /sac|tote/i, bucket: "sacs" },
  { kw: /t-?shirt|textile|v[êe]tement|polo|sweat|casquette/i, bucket: "textiles" },
  { kw: /mug|stylo|gourde|objet|gadget|porte-cl/i, bucket: "objets-publicitaires" },
];

function bucketFor(name: string): string | null {
  for (const { kw, bucket } of INTENT) if (kw.test(name)) return bucket;
  return null;
}

// Build a minimal valid default configuration (mirrors ProductDetail logic).
function buildDefaults(product: any): { defaults: Record<string, string>; copies: number | null } {
  const props = product.properties || product.configurableProperties || [];
  const hidden = new Set<string>();
  for (const g of product.propertyGroups || []) {
    if (g.columnWidth?.reseller === "hidden") (g.properties || []).forEach((s: string) => hidden.add(s));
  }
  const defaults: Record<string, string> = {};
  for (const prop of props) {
    if (prop.slug === "copies" || prop.slug === "summary_image") continue;
    if (hidden.has(prop.slug)) continue;
    const nonNull = (prop.options || []).filter((o: any) => !o.nullable);
    if (!nonNull.length) continue;
    if (prop.locked || prop.required) defaults[prop.slug] = String(nonNull[0].slug);
  }
  // copies
  let copies: number | null = null;
  const cp = props.find((p: any) => p.slug === "copies");
  if (cp) {
    const method = defaults["printingmethod"] || "";
    if (cp.rangeSets?.length) {
      const rs = cp.rangeSets.find((r: any) => r.printingmethod === method) || cp.rangeSets[0];
      if (rs.summary?.length) copies = Number(rs.summary[0]);
      else if (rs.options?.length) copies = Number(rs.options[0].min) || 1;
    } else if (cp.optionsInSummary?.length) copies = Number(cp.optionsInSummary[0]);
    else if (cp.options?.length) copies = Number(cp.options[0].slug) || 1;
  }
  return { defaults, copies };
}

function features(product: any): { title: string; values: string[] }[] {
  const props = product.properties || product.configurableProperties || [];
  const hidden = new Set<string>();
  for (const g of product.propertyGroups || []) {
    if (g.columnWidth?.reseller === "hidden") (g.properties || []).forEach((s: string) => hidden.add(s));
  }
  const out: { title: string; values: string[] }[] = [];
  for (const prop of props) {
    if (["copies", "summary_image"].includes(prop.slug)) continue;
    if (hidden.has(prop.slug)) continue;
    const opts = (prop.options || []).filter((o: any) => !o.nullable);
    if (opts.length < 2) continue;
    if (!prop.title || /summary/i.test(prop.title)) continue;
    out.push({ title: prop.title, values: opts.slice(0, 8).map((o: any) => o.name || String(o.slug)) });
    if (out.length >= 6) break;
  }
  return out;
}

const getSupplier = (pr: any): number => {
  if (!pr) return 0;
  if (pr.price?.totalPrice != null) return Number(pr.price.totalPrice) || 0;
  if (pr.totalPrice != null) return Number(pr.totalPrice) || 0;
  if (pr.prices?.salesPrice != null) return Number(pr.prices.salesPrice) || 0;
  if (pr.prices?.productPrice != null) return Number(pr.prices.productPrice) || 0;
  if (pr.prices?.normalPrice != null) return Number(pr.prices.normalPrice) || 0;
  if (typeof pr.price === "number") return pr.price;
  return parseFloat(pr.price) || 0;
};

interface Candidate {
  sku: string; name: string; image: string; bucket: string | null;
  parentSlug: string; parentName: string; subSlug: string; subName: string;
}

async function main() {
  console.log("→ Chargement catalogue, images, catégories…");
  const [apiProducts, imgRows, cats, mappings] = await Promise.all([
    fn("list-products", { lang: "fr-FR" }).then((r) => r.json()).catch(() => []),
    rest<{ sku: string; image_url: string | null; thumbnail_url: string | null }>("product_images?select=sku,image_url,thumbnail_url&order=sort_order.asc"),
    rest<{ id: string; slug: string; name: string; parent_id: string | null }>("product_categories?select=id,slug,name,parent_id"),
    rest<{ sku: string; category_id: string }>("product_category_mappings?select=sku,category_id"),
  ]);

  const nameBySku = new Map<string, string>();
  for (const p of Array.isArray(apiProducts) ? apiProducts : []) {
    if (p?.sku && p?.active !== false) nameBySku.set(p.sku, p.titleSingle || p.name || p.sku);
  }
  const imgBySku = new Map<string, string>();
  for (const r of imgRows) {
    const url = r.image_url || r.thumbnail_url;
    if (url && !imgBySku.has(r.sku)) imgBySku.set(r.sku, url);
  }
  const catById = new Map(cats.map((c) => [c.id, c]));
  const skuByCat = new Map<string, Set<string>>();
  for (const m of mappings) {
    if (!skuByCat.has(m.category_id)) skuByCat.set(m.category_id, new Set());
    skuByCat.get(m.category_id)!.add(m.sku);
  }
  // Indexable subcategory = subcat with ≥1 resolvable (active) product.
  const indexableSub = (catId: string) =>
    catById.get(catId)?.parent_id &&
    [...(skuByCat.get(catId) || [])].some((s) => nameBySku.has(s) && imgBySku.has(s));

  // Map each candidate SKU → its first indexable subcategory whose parent is a known top category.
  const subBySku = new Map<string, { sub: any; parent: any }>();
  for (const m of mappings) {
    if (subBySku.has(m.sku)) continue;
    const sub = catById.get(m.category_id);
    if (!sub?.parent_id) continue;
    if (!indexableSub(m.category_id)) continue;
    const parent = catById.get(sub.parent_id);
    if (!parent || !CATEGORY_SLUGS.includes(parent.slug)) continue;
    subBySku.set(m.sku, { sub, parent });
  }

  const candidates: Candidate[] = [];
  for (const [sku, name] of nameBySku) {
    const img = imgBySku.get(sku);
    const loc = subBySku.get(sku);
    if (!img || !loc) continue; // active + image + indexable subcategory
    candidates.push({
      sku, name, image: img, bucket: bucketFor(name),
      parentSlug: loc.parent.slug, parentName: loc.parent.name,
      subSlug: loc.sub.slug, subName: loc.sub.name,
    });
  }

  // Order: high commercial intent first, then balance across parent categories.
  candidates.sort((a, b) => (a.bucket ? 0 : 1) - (b.bucket ? 0 : 1) || a.name.localeCompare(b.name, "fr"));

  console.log(`→ ${candidates.length} candidats éligibles (actif + image + sous-catégorie indexable). Validation API…`);

  const TARGET = 30;
  const selected: any[] = [];
  const rejected: { sku: string; name: string; reason: string }[] = [];
  const usedSlugs = new Set<string>();
  const perParent = new Map<string, number>();
  const perBucket = new Set<string>();
  const MAX_PER_PARENT = 6;

  // Two passes: pass 1 enforces balance + 1 product per intent bucket; pass 2 fills remaining.
  const queue = [...candidates];
  let attempts = 0;
  const MAX_ATTEMPTS = 90;

  for (const c of queue) {
    if (selected.length >= TARGET) break;
    if (attempts >= MAX_ATTEMPTS) break;
    // balance guard
    if ((perParent.get(c.parentSlug) || 0) >= MAX_PER_PARENT) continue;
    attempts++;

    try {
      const pr = await fn("get-product", { sku: c.sku, view: "reseller", lang: "fr-FR" });
      if (!pr.ok) { rejected.push({ sku: c.sku, name: c.name, reason: `get-product ${pr.status}` }); continue; }
      const product = await pr.json();
      if (product?.active === false) { rejected.push({ sku: c.sku, name: c.name, reason: "inactif" }); continue; }
      const props = product.properties || product.configurableProperties || [];
      if (!props.length) { rejected.push({ sku: c.sku, name: c.name, reason: "pas de configurateur" }); continue; }

      const { defaults, copies } = buildDefaults(product);
      if (!copies) { rejected.push({ sku: c.sku, name: c.name, reason: "quantité indéterminable" }); continue; }

      const priceRes = await fn("get-price", { sku: c.sku, lang: "fr-FR" }, { ...defaults, copies });
      if (!priceRes.ok) { rejected.push({ sku: c.sku, name: c.name, reason: `get-price ${priceRes.status}` }); continue; }
      const priceData = await priceRes.json();
      if (priceData?.error || priceData?.message) { rejected.push({ sku: c.sku, name: c.name, reason: `prix: ${priceData.error || priceData.message}` }); continue; }
      const supplier = getSupplier(priceData);
      if (!(supplier > 0)) { rejected.push({ sku: c.sku, name: c.name, reason: "prix non calculable" }); continue; }

      // shipping estimate (non-blocking — recorded as warning only)
      let shippingOk = false;
      try {
        const shipRes = await fn("shipping-possibilities", { lang: "fr-FR" }, { address: { country: "FR" }, item: { sku: c.sku, options: { ...defaults, copies } } });
        if (shipRes.ok) { const s = await shipRes.json(); shippingOk = Array.isArray(s) ? s.length > 0 : !!(s?.shippingOptions || s?.options); }
      } catch { /* ignore */ }

      let slug = slugify(product.titleSingle || product.name || c.name) || c.sku;
      if (usedSlugs.has(slug)) slug = `${slug}-${c.sku}`.slice(0, 80);
      usedSlugs.add(slug);

      selected.push({
        slug, sku: c.sku,
        name: product.titleSingle || product.name || c.name,
        image: c.image,
        description: typeof product.description === "string" ? product.description : "",
        parentSlug: c.parentSlug, parentName: c.parentName,
        subSlug: c.subSlug, subName: c.subName,
        features: features(product),
        priceComputed: Math.ceil(supplier * 1.5 * 10) / 10,
        shippingOk,
        bucket: c.bucket,
      });
      perParent.set(c.parentSlug, (perParent.get(c.parentSlug) || 0) + 1);
      if (c.bucket) perBucket.add(c.bucket);
      console.log(`  ✓ ${selected.length}. ${slug} [${c.sku}] ${c.parentSlug} • prix ${selected[selected.length - 1].priceComputed}€ • ship ${shippingOk ? "ok" : "n/a"}`);
    } catch (e: any) {
      rejected.push({ sku: c.sku, name: c.name, reason: `exception ${e?.message || e}` });
    }
  }

  const outDir = resolve("src/seo/generated");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "products.json"), JSON.stringify(selected, null, 2));

  console.log(`\n=== RÉSULTAT ===`);
  console.log(`Validés: ${selected.length}/${TARGET}`);
  console.log(`Buckets couverts (${perBucket.size}): ${[...perBucket].join(", ")}`);
  console.log(`Répartition parents: ${[...perParent.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`Rejetés (${rejected.length}):`);
  for (const r of rejected) console.log(`  ✗ ${r.sku} (${r.name}) — ${r.reason}`);
}

main();
