// Assembles the SeoPage[] for prerendering, mixing the editorial content
// registry with live catalog/location data from the database.
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { SeoPage, LinkItem, ContentSection } from "../../src/seo/types";
import { CATEGORY_CONTENT, CATEGORY_SLUGS } from "../../src/seo/content/categories";
import { article } from "../../src/seo/content/fr";
import { SERVICE_CONTENT } from "../../src/seo/content/services";
import {
  CITY_PROFILES, DEPT_PROFILES, CITY_OFFICIAL, DEPT_OFFICIAL, CCI_GRAND_EST,
  PRODUCT_CARDS, CATEGORY_LINKS_VARIED, SERVICE_LINKS_VARIED, J2L_ECOSYSTEM,
} from "../../src/seo/content/local";
import {
  breadcrumbLd, collectionPageLd, serviceLd, webPageLd, faqLd, productLd,
} from "../../src/seo/schema";
import { getProductSEOData, detectFamily } from "../../src/lib/product-seo";
import {
  CATEGORY_KEYWORDS, FAMILY_KEYWORDS, seedFrom, pickN, type SemanticEntry,
} from "../../src/seo/data/semantic-keywords";
import { isExcludedSku } from "../../src/config/excluded-products";
import { loadGeo } from "./geo-data";
import {
  cityCopy, deptCopy, seedOf, cityArchetype, type GenCity, type GenDept, type NeighborRef,
} from "../../src/seo/content/geo-cities";
import { regionCopy, type GenRegion } from "../../src/seo/content/regions";
import {
  cityHeroIndex, deptHeroIndex, regionHeroIndex, heroAt, HERO_BANK,
} from "../../src/seo/content/hero-bank";

// Catalog CTA used on category/subcategory SEO pages. SEO pages NEVER fetch or
// embed the Print.com catalog/configurator — they only link to the existing one.
const CATALOG_CTA = { label: "Voir les produits dans le catalogue", path: "/products" };

/* ----------------------------------------------------------------------------
 * Semantic SEO enrichment helpers (categories + subcategories).
 * Pure editorial content derived from the semantic map. NEVER touches prices,
 * SKUs, the Print.com API or the configurator — only generates copy + links.
 * Seeded by slug so two pages of the same family stay distinct (anti-dup).
 * -------------------------------------------------------------------------- */
const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function frList(items: string[]): string {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a[0] || "";
  return `${a.slice(0, -1).join(", ")} et ${a[a.length - 1]}`;
}

/** Merge several FAQ pools, dedup by question, cap to `max`. */
function mergeFaq(pools: { q: string; a: string }[][], max: number): { q: string; a: string }[] {
  const seen = new Set<string>();
  const out: { q: string; a: string }[] = [];
  for (const pool of pools) {
    for (const f of pool || []) {
      const k = f.q.trim().toLowerCase();
      if (!f.q || !f.a || seen.has(k)) continue;
      seen.add(k);
      out.push(f);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** Build extra editorial sections for a category from its semantic universe. */
function categorySemanticSections(entry: SemanticEntry, seed: number): ContentSection[] {
  const secs: ContentSection[] = [];
  if (entry.anchors?.length) secs.push({ heading: "Familles de produits", bullets: entry.anchors.map(cap1) });
  if (entry.usages?.length) secs.push({ heading: "Usages les plus fréquents", bullets: entry.usages });
  if (entry.sectors?.length) secs.push({ heading: "Secteurs professionnels concernés", bullets: entry.sectors.map(cap1) });
  const matFin = [...(entry.materials || []), ...(entry.formats || []), ...(entry.finitions || [])];
  if (matFin.length) secs.push({ heading: "Matériaux, formats et finitions", bullets: matFin });
  const usageHint = frList(pickN(entry.usages, seed, 2).map((u) => u.toLowerCase()));
  const supportHint = frList(pickN(entry.materials.length ? entry.materials : entry.finitions, seed + 1, 2));
  secs.push({
    heading: "Guide de choix",
    paragraphs: [
      `Pour bien choisir, partez de votre usage (${usageHint}), puis du support le plus adapté (${supportHint}). ` +
      `Configurez ensuite le format, la quantité et les finitions directement en ligne pour obtenir un prix immédiat, ou demandez un devis gratuit pour un accompagnement personnalisé.`,
    ],
  });
  return secs;
}

/** Build the full editorial section set for a subcategory. */
function subcategorySections(entry: SemanticEntry, name: string, seed: number): ContentSection[] {
  const secs: ContentSection[] = [];
  if (entry.anchors?.length) secs.push({ heading: `Types de « ${name} » disponibles`, bullets: pickN(entry.anchors, seed, Math.min(4, entry.anchors.length)) });
  if (entry.usages?.length) secs.push({ heading: "Usages", bullets: pickN(entry.usages, seed + 1, 4) });
  if (entry.formats?.length) secs.push({ heading: "Formats", bullets: entry.formats });
  if (entry.materials?.length) secs.push({ heading: "Supports et matériaux", bullets: entry.materials });
  if (entry.finitions?.length) secs.push({ heading: "Finitions", bullets: entry.finitions });
  if (entry.sectors?.length) secs.push({ heading: "Secteurs concernés", bullets: pickN(entry.sectors, seed + 2, 5).map(cap1) });
  const usageHint = frList(pickN(entry.usages, seed + 3, 2).map((u) => u.toLowerCase()));
  secs.push({
    heading: "Guide de choix",
    paragraphs: [
      `Pour « ${name} », identifiez d'abord votre usage (${usageHint}), puis sélectionnez format, support et finitions dans le configurateur en ligne. ` +
      `Le prix s'affiche immédiatement et un devis gratuit reste disponible pour les projets sur mesure.`,
    ],
  });
  return secs;
}

/** Subcategory FAQ: a seeded subset of the family/category pool + 1 specific Q. */
function subcategoryFaq(entry: SemanticEntry, name: string, seed: number): { q: string; a: string }[] {
  const specific = [
    {
      q: `Peut-on commander « ${name} » en ligne ?`,
      a: `Oui. La gamme « ${name} » se configure entièrement en ligne — format, support, finitions et quantité — puis est livrée partout en France, avec un devis gratuit sur demande.`,
    },
  ];
  return mergeFaq([specific, pickN(entry.faq, seed, entry.faq.length)], 8);
}


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

async function rest<T = any>(path: string): Promise<T[]> {
  if (!SB || !ANON) return [];
  const PAGE = 1000;
  const out: T[] = [];
  try {
    for (let off = 0; ; off += PAGE) {
      const sep = path.includes("?") ? "&" : "?";
      const r = await fetch(`${SB}/rest/v1/${path}${sep}limit=${PAGE}&offset=${off}`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      });
      if (!r.ok) break;
      const rows = (await r.json()) as T[];
      out.push(...rows);
      if (rows.length < PAGE) break;
    }
  } catch { /* keep partial */ }
  return out;
}


// City/department/region pages are now generated from the merged national
// geographic reference (src/seo/data/geography-national.json): 599 cities,
// 101 departments, 18 regions. The PRIORITY_* editorial profiles in local.ts
// still enrich the matching pages, but the page set is no longer limited to
// them.

const SERVICE_LINKS: LinkItem[] = [
  { label: "Impression numérique", path: "/impression-numerique" },
  { label: "Grand format", path: "/grand-format" },
  { label: "Supports publicitaires", path: "/supports-publicitaires" },
  { label: "Personnalisation", path: "/personnalisation" },
];

export async function buildAllPages(): Promise<SeoPage[]> {
  const geo = loadGeo();
  const cats = await rest<{ id: string; slug: string; name: string; parent_id: string | null }>(
    "product_categories?select=id,slug,name,parent_id",
  );
  const childrenOf = new Map<string, typeof cats>();
  for (const c of cats) if (c.parent_id) {
    if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
    childrenOf.get(c.parent_id)!.push(c);
  }



  const pages: SeoPage[] = [];
  const home: BreadcrumbItemLite = { name: "Accueil", path: "/" };
  // Remove consecutive identical labels (e.g. city == department: Paris > Paris).
  const dedupeCrumb = <T extends { name: string }>(items: T[]): T[] =>
    items.filter((it, i) => i === 0 || it.name.trim().toLowerCase() !== items[i - 1].name.trim().toLowerCase());

  // ── Homepage ──
  pages.push({
    path: "/",
    // Must match the runtime homepage (src/pages/Index.tsx useSEO + H1) so the
    // prerendered head/H1 is identical to what React renders — no divergence.
    title: "J2L Print – Imprimerie en ligne | Impression & supports publicitaires",
    description:
      "J2L Print, votre imprimerie en ligne. Impression numérique, flyers, cartes de visite, affiches, bâches, adhésifs, objets publicitaires. Devis gratuit, nous livrons partout.",
    h1: "J2L Print — Votre imprimerie en ligne",
    intro: [
      "J2L Print imprime tous vos supports de communication et vous livre partout en France. Configurez votre produit en ligne, validez votre fichier, recevez votre commande.",
    ],
    breadcrumb: [home],
    internalLinks: [
      { heading: "Nos univers", links: CATEGORY_SLUGS.map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` })) },
      { heading: "Nos services", links: SERVICE_LINKS },
    ],
    // Organization JSON-LD lives once in the static index.html shell (sitewide);
    // don't re-emit it here or the homepage would carry a duplicate.
    jsonLd: [],
  });

  // ── Catalogue ──
  const topCats = cats.filter((c) => !c.parent_id);
  pages.push({
    path: "/catalogue",
    title: "Catalogue d'impression et supports de communication",
    description:
      "Découvrez tout le catalogue J2L Print : impression papier, signalétique, étiquettes, textiles, objets publicitaires et grand format, livrés en France.",
    h1: "Catalogue J2L Print",
    intro: [
      "Parcourez l'ensemble de nos univers d'impression. Du flyer à la bâche grand format, chaque produit se configure en ligne avec ses formats, matières et finitions.",
    ],
    breadcrumb: [home, { name: "Catalogue", path: "/catalogue" }],
    productGrid: {
      heading: "Supports les plus demandés",
      intro: "Un aperçu des produits les plus commandés. Cliquez pour configurer le vôtre.",
      cards: PRODUCT_CARDS,
    },
    internalLinks: [
      { heading: "Catégories", links: CATEGORY_SLUGS.map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` })) },
    ],
    jsonLd: [
      breadcrumbLd([home, { name: "Catalogue", path: "/catalogue" }]),
      collectionPageLd({
        name: "Catalogue J2L Print",
        description: "Tous les univers d'impression et supports de communication.",
        path: "/catalogue",
        items: topCats.map((c) => ({ name: c.name, path: `/categorie/${c.slug}` })),
      }),
    ],
    ogType: "website",
  });

  // ── 8 categories ──
  for (const slug of CATEGORY_SLUGS) {
    const content = CATEGORY_CONTENT[slug];
    const cat = cats.find((c) => c.slug === slug && !c.parent_id);
    const subs = (cat && childrenOf.get(cat.id)) || [];
    const crumb = [home, { name: "Catalogue", path: "/catalogue" }, { name: content.name, path: `/categorie/${slug}` }];
    const subLinks: LinkItem[] = subs.map((s) => ({ label: s.name, path: `/categorie/${slug}/${s.slug}` }));
    const relatedCats: LinkItem[] = CATEGORY_SLUGS.filter((s) => s !== slug).slice(0, 4)
      .map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` }));

    pages.push({
      path: `/categorie/${slug}`,
      title: content.title,
      description: content.description,
      h1: content.h1,
      intro: content.intro,
      breadcrumb: crumb,
      sections: content.sections,
      faq: content.faq,
      cta: CATALOG_CTA,
      internalLinks: [
        ...(subLinks.length ? [{ heading: "Sous-catégories", links: subLinks }] : []),
        { heading: "Catégories associées", links: relatedCats },
        { heading: "Nos services", links: SERVICE_LINKS },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        collectionPageLd({
          name: content.name,
          description: content.description,
          path: `/categorie/${slug}`,
          items: subs.map((s) => ({ name: s.name, path: `/categorie/${slug}/${s.slug}` })),
        }),
        faqLd(content.faq),
      ],
    });

    // ── Subcategories: editorial text + internal links + a button toward the
    //    existing catalog. They never fetch, embed, rebuild or intercept the
    //    Print.com catalog/configurator — they only link to /products.
    subs.forEach((sub, si) => {
      const subCrumb = [...crumb, { name: sub.name, path: `/categorie/${slug}/${sub.slug}` }];
      const angles = [
        `Découvrez la sélection « ${sub.name} » de J2L Print, au sein de l'univers ${content.name}. Configurez votre produit en ligne — format, matière et finitions — et recevez votre commande partout en France.`,
        `Pour vos besoins en « ${sub.name} », J2L Print propose une gamme professionnelle dans la catégorie ${content.name}, avec un rendu fidèle et des finitions au choix.`,
        `La rubrique « ${sub.name} » regroupe nos produits ${content.name.toLowerCase()} adaptés à cet usage : choisissez vos options en ligne et profitez de tarifs dégressifs selon la quantité.`,
      ];
      const near = subLinks.filter((l) => !l.path.endsWith(`/${sub.slug}`)).slice(0, 6);
      const subFaq = [
        {
          q: `Peut-on commander « ${sub.name} » en ligne ?`,
          a: `Oui. La gamme « ${sub.name} » se configure entièrement en ligne — format, matière, finitions et quantité — puis est livrée partout en France.`,
        },
        {
          q: "Comment obtenir un devis ?",
          a: "Configurez votre produit dans le catalogue ou décrivez votre besoin dans le formulaire de devis : nous revenons vers vous avec une proposition personnalisée.",
        },
      ];
      pages.push({
        path: `/categorie/${slug}/${sub.slug}`,
        title: `${sub.name} — ${content.name}`,
        description: `${sub.name} : impression professionnelle en ligne (${content.name.toLowerCase()}). Formats, matières et finitions au choix, devis et livraison partout en France.`,
        h1: sub.name,
        intro: [angles[si % angles.length]],
        breadcrumb: subCrumb,
        productGrid: {
          heading: `Supports populaires dans « ${sub.name} »`,
          intro: "Configurez votre produit dans le catalogue en ligne.",
          cards: PRODUCT_CARDS,
        },
        cta: CATALOG_CTA,
        faq: subFaq,
        internalLinks: [
          { heading: "Catégorie", links: [{ label: content.name, path: `/categorie/${slug}` }] },
          ...(near.length ? [{ heading: "Sous-catégories proches", links: near }] : []),
          { heading: "Nos services", links: SERVICE_LINKS },
        ],
        jsonLd: [
          breadcrumbLd(subCrumb),
          webPageLd({
            name: sub.name,
            description: `${sub.name} dans ${content.name}.`,
            path: `/categorie/${slug}/${sub.slug}`,
          }),
          faqLd(subFaq),
        ],
      });
    });
  }

  // ── Geographic pages (599 cities / 101 departments / 18 regions) ──
  const cityBySlug = new Map(geo.cities.map((c) => [c.slug, c]));
  const deptBySlug = new Map(geo.departments.map((d) => [d.slug, d]));
  const variedCats = () => CATEGORY_LINKS_VARIED.map((l) => ({ label: l.anchor, path: l.path }));
  const variedServices = () => SERVICE_LINKS_VARIED.map((l) => ({ label: l.anchor, path: l.path }));
  const actionLinks = [
    { label: "demander un devis personnalisé", path: "/#devis" },
    { label: "voir tout le catalogue", path: "/catalogue" },
  ];

  // ── J2L ecosystem links (deterministic subset per page) ──
  // villes : 1 à 2 liens · départements : 2 à 3 · régions : les 4.
  const ecoLinks = (seed: number, n: number): LinkItem[] => {
    const out: LinkItem[] = [];
    const start = seed % J2L_ECOSYSTEM.length;
    for (let i = 0; i < Math.min(n, J2L_ECOSYSTEM.length); i++) {
      out.push(J2L_ECOSYSTEM[(start + i) % J2L_ECOSYSTEM.length]);
    }
    return out;
  };
  const ecoGroup = (seed: number, n: number) => ({
    heading: "L'écosystème J2L",
    links: ecoLinks(seed, n),
  });

  // ── Hero assignment with neighbour avoidance ──
  // Deterministic base index (archetype + seed) then, if a neighbouring city
  // already uses the same hero, shift to the next free one so two adjacent
  // cities rarely share the exact same visual.
  const cityHero = new Map<string, number>();
  for (const gc of geo.cities) {
    const arch = cityArchetype({
      name: gc.name, slug: gc.slug, cp: gc.postalCodes[0] || "",
      department: gc.departmentName, departmentSlug: gc.departmentSlug,
      region: gc.regionName, regionSlug: gc.regionSlug, neighbors: [],
      economy: CITY_PROFILES[gc.slug]?.economy, audiences: CITY_PROFILES[gc.slug]?.audiences,
    });
    let idx = cityHeroIndex(arch, seedOf(gc.slug));
    const usedByNeighbors = new Set<number>();
    for (const ns of gc.nearbyCitySlugs || []) {
      if (cityHero.has(ns)) usedByNeighbors.add(cityHero.get(ns)!);
    }
    for (let step = 0; step < HERO_BANK.length && usedByNeighbors.has(idx); step++) {
      idx = (idx + 1) % HERO_BANK.length;
    }
    cityHero.set(gc.slug, idx);
  }

  // ── Cities ──
  for (const gc of geo.cities) {
    const profile = CITY_PROFILES[gc.slug];
    const neighbors: NeighborRef[] = (gc.nearbyCitySlugs || [])
      .filter((s) => cityBySlug.has(s))
      .slice(0, 6)
      .map((s) => ({ name: cityBySlug.get(s)!.name, slug: s }));
    const gen: GenCity = {
      name: gc.name,
      slug: gc.slug,
      cp: gc.postalCodes[0] || "",
      department: gc.departmentName,
      departmentSlug: gc.departmentSlug,
      region: gc.regionName,
      regionSlug: gc.regionSlug,
      neighbors,
      economy: profile?.economy,
      sectors: profile?.sectors,
      audiences: profile?.audiences,
      events: profile?.events,
    };
    const copy = cityCopy(gen);
    const hero = heroAt(cityHero.get(gc.slug) ?? cityHeroIndex(cityArchetype(gen), seedOf(gc.slug)));
    const crumb = dedupeCrumb([
      home,
      { name: "Zones desservies", path: "/imprimerie" },
      { name: gc.regionName, path: `/region/${gc.regionSlug}` },
      { name: gc.departmentName, path: `/departement/${gc.departmentSlug}` },
      { name: gc.name, path: `/ville/${gc.slug}` },
    ]);
    const dep = article(gc.departmentName);
    const reg = article(gc.regionName);
    const official = CITY_OFFICIAL[gc.slug];
    const ext: LinkItem[] = [];
    if (official) ext.push({ label: official.label, path: official.url, external: true });
    if (gc.regionSlug === "grand-est") ext.push(CCI_GRAND_EST);

    pages.push({
      path: `/ville/${gc.slug}`,
      title: copy.title,
      description: copy.description,
      h1: copy.h1,
      hero: {
        image: hero.file,
        imageAlt: `${hero.alt} — livraison à ${gc.name}`,
        eyebrow: copy.heroEyebrow,
        tagline: copy.heroTagline,
        ctas: [
          { label: copy.ctaLabel, path: "/catalogue", variant: "primary" },
          { label: "Demander un devis", path: "/#devis", variant: "secondary" },
        ],
      },
      intro: copy.intro,
      breadcrumb: crumb,
      sections: copy.sections,
      productGrid: { heading: copy.productGridHeading, intro: copy.productGridIntro, cards: PRODUCT_CARDS },
      cta: { label: copy.ctaLabel, path: "/catalogue" },
      faq: copy.faq,
      internalLinks: [
        ...(neighbors.length
          ? [{ heading: "Villes proches desservies", links: neighbors.map((n) => ({ label: n.name, path: `/ville/${n.slug}` })) }]
          : []),
        { heading: "Nos univers d'impression", links: variedCats() },
        { heading: "Nos services", links: variedServices() },
        {
          heading: "Votre territoire",
          links: [
            { label: `Impression ${dep.dans}`, path: `/departement/${gc.departmentSlug}` },
            { label: `Impression ${reg.dans}`, path: `/region/${gc.regionSlug}` },
          ],
        },
        ecoGroup(seedOf(gc.slug), 2),
        { heading: "Passez à l'action", links: actionLinks },
      ],
      ...(ext.length ? { externalLinks: ext } : {}),
      jsonLd: [
        breadcrumbLd(crumb),
        webPageLd({ name: `Impression à ${gc.name}`, description: `Impression en ligne livrée à ${gc.name}.`, path: `/ville/${gc.slug}` }),
        serviceLd({ name: `Impression pour les professionnels à ${gc.name}`, description: `Impression en ligne avec livraison à ${gc.name} et ${dep.dans}.`, areaServed: gc.name }),
        faqLd(copy.faq),
      ],
    });
  }

  // ── Departments ──
  for (const gd of geo.departments) {
    const dp = DEPT_PROFILES[gd.slug];
    const cityLinks = gd.citySlugs
      .filter((s) => cityBySlug.has(s))
      .map((s) => ({ label: cityBySlug.get(s)!.name, path: `/ville/${s}` }));
    const gen: GenDept = {
      name: gd.name,
      slug: gd.slug,
      code: gd.code,
      region: gd.regionName,
      regionSlug: gd.regionSlug,
      cityNames: cityLinks.map((l) => l.label),
      economy: dp?.economy,
      sectors: dp?.sectors,
    };
    const copy = deptCopy(gen);
    const hero = heroAt(deptHeroIndex(seedOf(gd.slug)));
    const crumb = [
      home,
      { name: "Zones desservies", path: "/imprimerie" },
      { name: gd.regionName, path: `/region/${gd.regionSlug}` },
      { name: gd.name, path: `/departement/${gd.slug}` },
    ];
    const neighborDepts = (gd.neighborDepartmentSlugs || [])
      .filter((s) => deptBySlug.has(s))
      .map((s) => ({ label: deptBySlug.get(s)!.name, path: `/departement/${s}` }));
    const reg = article(gd.regionName);
    const official = DEPT_OFFICIAL[gd.slug];
    const ext: LinkItem[] = [];
    if (official) ext.push({ label: official.label, path: official.url, external: true });
    if (gd.regionSlug === "grand-est") ext.push(CCI_GRAND_EST);

    pages.push({
      path: `/departement/${gd.slug}`,
      title: copy.title,
      description: copy.description,
      h1: copy.h1,
      hero: {
        image: hero.file,
        imageAlt: `${hero.alt} — livraison ${article(gd.name).dans}`,
        eyebrow: copy.heroEyebrow,
        tagline: copy.heroTagline,
        ctas: [
          { label: copy.ctaLabel, path: "/catalogue", variant: "primary" },
          { label: "Demander un devis", path: "/#devis", variant: "secondary" },
        ],
      },
      intro: copy.intro,
      breadcrumb: crumb,
      sections: copy.sections,
      productGrid: { heading: copy.productGridHeading, intro: copy.productGridIntro, cards: PRODUCT_CARDS },
      cta: { label: copy.ctaLabel, path: "/catalogue" },
      faq: copy.faq,
      internalLinks: [
        ...(cityLinks.length ? [{ heading: "Villes du département", links: cityLinks }] : []),
        ...(neighborDepts.length ? [{ heading: "Départements voisins", links: neighborDepts }] : []),
        { heading: "Votre région", links: [{ label: `Impression ${reg.dans}`, path: `/region/${gd.regionSlug}` }] },
        { heading: "Nos univers d'impression", links: variedCats() },
        { heading: "Nos services", links: variedServices() },
        ecoGroup(seedOf(gd.slug), 3),
        { heading: "Passez à l'action", links: actionLinks },
      ],
      ...(ext.length ? { externalLinks: ext } : {}),
      jsonLd: [
        breadcrumbLd(crumb),
        webPageLd({ name: `Impression ${article(gd.name).dans}`, description: `Impression en ligne livrée ${article(gd.name).dans}.`, path: `/departement/${gd.slug}` }),
        serviceLd({ name: `Impression ${article(gd.name).dans}`, description: `Impression en ligne avec livraison ${article(gd.name).dans}.`, areaServed: gd.name }),
        faqLd(copy.faq),
      ],
    });
  }

  // ── Regions ──
  for (const gr of geo.regions) {
    const deptLinks = gr.departmentSlugs
      .filter((s) => deptBySlug.has(s))
      .map((s) => ({ label: deptBySlug.get(s)!.name, path: `/departement/${s}` }));
    const regionCities = geo.cities.filter((c) => c.regionSlug === gr.slug);
    const cityLinks = regionCities.slice(0, 24).map((c) => ({ label: c.name, path: `/ville/${c.slug}` }));
    const gen: GenRegion = {
      name: gr.name,
      slug: gr.slug,
      departmentNames: deptLinks.map((l) => l.label),
      cityNames: regionCities.map((c) => c.name),
    };
    const copy = regionCopy(gen);
    const hero = heroAt(regionHeroIndex(seedOf(gr.slug)));
    const art = article(gr.name);
    const crumb = [
      home,
      { name: "Zones desservies", path: "/imprimerie" },
      { name: gr.name, path: `/region/${gr.slug}` },
    ];

    pages.push({
      path: `/region/${gr.slug}`,
      title: copy.title,
      description: copy.description,
      h1: copy.h1,
      hero: {
        image: hero.file,
        imageAlt: `${hero.alt} — livraison ${art.dans}`,
        eyebrow: copy.heroEyebrow,
        tagline: copy.heroTagline,
        ctas: [
          { label: copy.ctaLabel, path: "/catalogue", variant: "primary" },
          { label: "Demander un devis", path: "/#devis", variant: "secondary" },
        ],
      },
      intro: copy.intro,
      breadcrumb: crumb,
      sections: copy.sections,
      productGrid: { heading: copy.productGridHeading, intro: copy.productGridIntro, cards: PRODUCT_CARDS },
      cta: { label: copy.ctaLabel, path: "/catalogue" },
      faq: copy.faq,
      internalLinks: [
        ...(deptLinks.length ? [{ heading: "Départements de la région", links: deptLinks }] : []),
        ...(cityLinks.length ? [{ heading: "Villes desservies", links: cityLinks }] : []),
        { heading: "Nos univers d'impression", links: variedCats() },
        { heading: "Nos services", links: variedServices() },
        ecoGroup(seedOf(gr.slug), J2L_ECOSYSTEM.length),
        { heading: "Passez à l'action", links: actionLinks },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        collectionPageLd({
          name: `Impression ${art.dans}`,
          description: copy.description,
          path: `/region/${gr.slug}`,
          items: deptLinks.map((l) => ({ name: l.label, path: l.path })),
        }),
        serviceLd({ name: `Impression ${art.dans}`, description: `Impression en ligne avec livraison ${art.dans}.`, areaServed: gr.name }),
        faqLd(copy.faq),
      ],
    });
  }


  // ── Service landing pages (4) ──
  // Mirror the published React routes so the prerendered HTML carries the
  // exact title/description/H1, a self-referencing canonical, real content,
  // a visible breadcrumb, internal links and WebPage + BreadcrumbList +
  // Service JSON-LD.
  for (const svc of SERVICE_CONTENT) {
    const path = `/${svc.slug}`;
    const crumb = [home, { name: svc.name, path }];
    const otherServices: LinkItem[] = SERVICE_CONTENT
      .filter((s) => s.slug !== svc.slug)
      .map((s) => ({ label: s.name, path: `/${s.slug}` }));
    pages.push({
      path,
      title: svc.title,
      description: svc.description,
      h1: svc.h1,
      intro: svc.intro,
      breadcrumb: crumb,
      sections: [
        { heading: svc.solutionsHeading, bullets: svc.solutions },
        ...(svc.closing ? [{ heading: "Bon à savoir", paragraphs: svc.closing }] : []),
      ],
      faq: svc.faq,
      internalLinks: [
        { heading: "Nos univers", links: CATEGORY_SLUGS.slice(0, 6).map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` })) },
        { heading: "Nos autres services", links: otherServices },
        { heading: "Catalogue", links: [{ label: "Voir tout le catalogue", path: "/catalogue" }] },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        webPageLd({ name: svc.h1, description: svc.description, path }),
        serviceLd({ name: svc.h1, description: svc.description, areaServed: "France" }),
        ...(svc.faq && svc.faq.length ? [faqLd(svc.faq)] : []),
      ],
      ogType: "website",
    });
  }
  return pages;
}




/* ----------------------------------------------------------------------------
 * Product detail pages (/products/:sku)
 * ----------------------------------------------------------------------------
 * Prerenders a real, crawler-readable HTML file for every PUBLIC product so the
 * Cloudflare worker can serve /products/<sku>/index.html in 200 with the right
 * <title>, canonical, <h1> and content — never the SPA homepage fallback.
 *
 * IMPORTANT — this NEVER touches prices, the Print.com API contract or the
 * runtime configurator. It only emits editorial SEO metadata + content. The
 * live React route (ProductDetail) still fetches the catalog/price/configurator
 * client-side and replaces this prerendered shell on hydration.
 */

interface CatalogProductLite {
  sku: string;
  name: string;
  thumbnailUrl?: string | null;
}

function cmsAssetUrl(assetId: string | undefined, assets: Record<string, any> | undefined): string | null {
  if (!assetId || !assets?.[assetId]?.file) return null;
  return `https:${assets[assetId].file}`;
}

async function proxyCall(action: string, params: Record<string, string> = {}): Promise<any> {
  if (!SB || !ANON) return null;
  try {
    const qs = new URLSearchParams({ action, ...params }).toString();
    const r = await fetch(`${SB}/functions/v1/printcom-proxy?${qs}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** Build the merged catalog (Print.com list + CMS) — mirror of the runtime
 *  getCatalogProducts(), but pure Node and defensive (never throws). */
async function fetchCatalogProducts(): Promise<Map<string, CatalogProductLite>> {
  const [apiProducts, cms] = await Promise.all([
    proxyCall("list-products", { lang: "fr-FR" }),
    proxyCall("get-cms"),
  ]);
  const assets = cms?.asset as Record<string, any> | undefined;
  const cmsProducts = cms?.product as Record<string, any> | undefined;
  const merged = new Map<string, CatalogProductLite>();

  for (const p of Array.isArray(apiProducts) ? apiProducts : []) {
    const sku = p?.sku;
    if (!sku) continue;
    if (p?.active === false) continue;
    const cmsProduct = cmsProducts
      ? (Object.values(cmsProducts).find((it: any) => it?.sku === sku) as any)
      : null;
    const thumbnailUrl =
      p?.thumbnailUrl || p?.thumbnail_url || cmsAssetUrl(cmsProduct?.image?.id || cmsProduct?.icon?.id, assets);
    merged.set(sku, { sku, name: p?.titleSingle || p?.name || sku, thumbnailUrl });
  }

  for (const cmsProduct of Object.values(cmsProducts || {})) {
    const sku = (cmsProduct as any)?.sku;
    if (!sku) continue;
    const thumbnailUrl = cmsAssetUrl((cmsProduct as any)?.image?.id || (cmsProduct as any)?.icon?.id, assets);
    if (merged.has(sku)) {
      const existing = merged.get(sku)!;
      if (!existing.thumbnailUrl && thumbnailUrl) existing.thumbnailUrl = thumbnailUrl;
      continue;
    }
    merged.set(sku, { sku, name: (cmsProduct as any)?.productName || sku, thumbnailUrl });
  }
  return merged;
}

function truncate(s: string, max = 158): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[\s,.;:]+\S*$/, "")}…`;
}

export async function buildProductPages(): Promise<SeoPage[]> {
  const home: BreadcrumbItemLite = { name: "Accueil", path: "/" };

  // 1. Public catalog = every SKU mapped to at least one category.
  const mappings = await rest<{ sku: string; category_id: string }>(
    "product_category_mappings?select=sku,category_id",
  );
  if (!mappings.length) return [];
  const skuCategories = new Map<string, string[]>();
  for (const m of mappings) {
    if (!m?.sku || !m?.category_id) continue;
    if (!skuCategories.has(m.sku)) skuCategories.set(m.sku, []);
    skuCategories.get(m.sku)!.push(m.category_id);
  }

  // 2. Category tree (for breadcrumbs).
  const cats = await rest<{ id: string; slug: string; name: string; parent_id: string | null }>(
    "product_categories?select=id,slug,name,parent_id",
  );
  const catById = new Map(cats.map((c) => [c.id, c]));

  // 3. Merged catalog (names + thumbnails) from Print.com via the proxy.
  const catalog = await fetchCatalogProducts();
  if (!catalog.size) return [];

  const productCrumb = (sku: string, name: string): BreadcrumbItemLite[] => {
    const ids = skuCategories.get(sku) || [];
    const resolved = ids.map((id) => catById.get(id)).filter(Boolean) as typeof cats;
    const sub = resolved.find((c) => c.parent_id);
    const top = sub ? catById.get(sub.parent_id!) : resolved.find((c) => !c.parent_id);
    const crumb: BreadcrumbItemLite[] = [home, { name: "Catalogue", path: "/catalogue" }];
    if (top) crumb.push({ name: top.name, path: `/categorie/${top.slug}` });
    if (top && sub) crumb.push({ name: sub.name, path: `/categorie/${top.slug}/${sub.slug}` });
    crumb.push({ name, path: `/products/${sku}` });
    return crumb;
  };

  const pages: SeoPage[] = [];
  // Only PUBLIC products (mapped to a category), sorted for deterministic output.
  const publicSkus = [...skuCategories.keys()]
    .filter((sku) => catalog.has(sku) && !isExcludedSku(sku))
    .sort();

  for (const sku of publicSkus) {
    const prod = catalog.get(sku)!;
    const name = prod.name || sku;
    const seo = getProductSEOData(name, sku);
    const crumb = productCrumb(sku, name);
    const path = `/products/${sku}`;
    const lower = name.toLowerCase();

    const sections = [
      { heading: `À quoi sert votre ${lower} ?`, paragraphs: [seo.useCases] },
      { heading: "Qualité d'impression et finitions", paragraphs: [seo.quality] },
    ];

    const related = crumb
      .filter((c) => c.path.startsWith("/categorie/"))
      .map((c) => ({ label: c.name, path: c.path }));

    pages.push({
      path,
      title: truncate(`${name} – Impression personnalisée | J2L Print`, 65),
      description: truncate(
        `${name} sur mesure : configuration en ligne, formats, matières et finitions au choix. Devis gratuit et livraison partout en France avec J2L Print.`,
      ),
      h1: name,
      intro: [seo.intro],
      breadcrumb: crumb,
      sections,
      cta: { label: "Demander un devis gratuit", path: "/#devis" },
      faq: seo.faq,
      internalLinks: [
        ...(related.length ? [{ heading: "Catégorie", links: related }] : []),
        {
          heading: "Nos services",
          links: [
            { label: "Impression numérique", path: "/impression-numerique" },
            { label: "Grand format", path: "/grand-format" },
            { label: "Supports publicitaires", path: "/supports-publicitaires" },
            { label: "Personnalisation", path: "/personnalisation" },
          ],
        },
        { heading: "Catalogue", links: [{ label: "Voir tout le catalogue", path: "/catalogue" }] },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        productLd({
          name,
          description: truncate(seo.intro, 300),
          sku,
          path,
          image: prod.thumbnailUrl || null,
          // Prices are NEVER computed/asserted here — left undefined on purpose.
          fromPrice: null,
        }),
        ...(seo.faq && seo.faq.length ? [faqLd(seo.faq)] : []),
      ],
      ogType: "product",
    });
  }

  return pages;
}


/* ----------------------------------------------------------------------------
 * Theme pages (/themes and /themes/:slug)
 * ----------------------------------------------------------------------------
 * Prerenders the themes index and one page per theme so the Cloudflare worker
 * serves real crawler-readable HTML (own title/canonical/H1/content) instead of
 * the SPA homepage fallback. Never touches prices, the Print.com API, the
 * configurator or the product/theme mappings — it only emits editorial SEO
 * content and links toward the existing /themes/:slug runtime routes.
 */
interface ThemeLite {
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export async function buildThemePages(): Promise<SeoPage[]> {
  const home: BreadcrumbItemLite = { name: "Accueil", path: "/" };

  const themes = (await rest<ThemeLite>(
    "product_themes?select=slug,name,description,sort_order&order=sort_order",
  )).filter((t) => t?.slug && t?.name);
  if (!themes.length) return [];

  const themesCrumb = [home, { name: "Catalogue", path: "/catalogue" }, { name: "Thèmes", path: "/themes" }];
  const themeLinks: LinkItem[] = themes.map((t) => ({ label: t.name, path: `/themes/${t.slug}` }));

  const pages: SeoPage[] = [];

  // ── Themes index ──
  pages.push({
    path: "/themes",
    title: "Thèmes & collections – Impression en ligne | J2L Print",
    description:
      "Explorez nos thèmes : Écologique, Nouveautés, Hôtels & restaurants, Bureau, Saison estivale et plus. Retrouvez les produits associés à chaque thème.",
    h1: "Thèmes",
    intro: [
      "Parcourez nos thèmes pour trouver rapidement les produits adaptés à chaque occasion et secteur. Chaque thème regroupe une sélection de supports d'impression à configurer en ligne et à recevoir partout en France.",
    ],
    breadcrumb: themesCrumb,
    internalLinks: [
      { heading: "Tous les thèmes", links: themeLinks },
      { heading: "Nos services", links: SERVICE_LINKS },
    ],
    jsonLd: [
      breadcrumbLd(themesCrumb),
      collectionPageLd({
        name: "Thèmes J2L Print",
        description: "Toutes nos collections thématiques d'impression et supports de communication.",
        path: "/themes",
        items: themes.map((t) => ({ name: t.name, path: `/themes/${t.slug}` })),
      }),
    ],
    ogType: "website",
  });

  // ── One page per theme ──
  for (const t of themes) {
    const path = `/themes/${t.slug}`;
    const crumb = [...themesCrumb, { name: t.name, path }];
    const desc = t.description?.trim()
      ? truncate(t.description)
      : truncate(
          `Thème « ${t.name} » : découvrez une sélection de produits d'impression personnalisée adaptés à ${t.name.toLowerCase()}. Configuration en ligne, devis gratuit et livraison partout en France.`,
        );
    const others = themeLinks.filter((l) => l.path !== path).slice(0, 8);
    const faq = [
      {
        q: `Que contient le thème « ${t.name} » ?`,
        a: `Le thème « ${t.name} » rassemble une sélection de produits d'impression à configurer en ligne — format, matière, finitions et quantité — livrés partout en France.`,
      },
      {
        q: "Comment commander un produit du thème ?",
        a: "Choisissez un produit du thème, configurez-le en ligne dans le catalogue, puis demandez votre devis gratuit.",
      },
    ];
    pages.push({
      path,
      title: truncate(`${t.name} – Thème impression personnalisée | J2L Print`, 65),
      description: desc,
      h1: t.name,
      intro: [
        `Découvrez la collection « ${t.name} » de J2L Print : une sélection de supports d'impression personnalisée à configurer en ligne et à recevoir partout en France.`,
      ],
      breadcrumb: crumb,
      cta: { label: "Voir les produits du thème", path },
      faq,
      internalLinks: [
        { heading: "Autres thèmes", links: others },
        { heading: "Catalogue", links: [{ label: "Voir tout le catalogue", path: "/catalogue" }] },
        { heading: "Nos services", links: SERVICE_LINKS },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        webPageLd({ name: t.name, description: desc, path }),
        faqLd(faq),
      ],
      ogType: "website",
    });
  }

  return pages;
}


type BreadcrumbItemLite = { name: string; path: string };

export function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
