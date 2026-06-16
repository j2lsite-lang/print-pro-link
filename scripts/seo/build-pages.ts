// Assembles the SeoPage[] for prerendering, mixing the editorial content
// registry with live catalog/location data from the database.
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { SeoPage, LinkItem } from "../../src/seo/types";
import { CATEGORY_CONTENT, CATEGORY_SLUGS } from "../../src/seo/content/categories";
import { article } from "../../src/seo/content/fr";
import { SERVICE_CONTENT } from "../../src/seo/content/services";
import {
  CITY_PROFILES, DEPT_PROFILES, CITY_OFFICIAL, DEPT_OFFICIAL, CCI_GRAND_EST,
  PRODUCT_CARDS, CATEGORY_LINKS_VARIED, SERVICE_LINKS_VARIED, J2L_ECOSYSTEM,
} from "../../src/seo/content/local";
import {
  breadcrumbLd, collectionPageLd, serviceLd, webPageLd, faqLd,
} from "../../src/seo/schema";
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
    const crumb = [
      home,
      { name: "Zones desservies", path: "/imprimerie" },
      { name: gc.regionName, path: `/region/${gc.regionSlug}` },
      { name: gc.departmentName, path: `/departement/${gc.departmentSlug}` },
      { name: gc.name, path: `/ville/${gc.slug}` },
    ];
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


type BreadcrumbItemLite = { name: string; path: string };

export function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
