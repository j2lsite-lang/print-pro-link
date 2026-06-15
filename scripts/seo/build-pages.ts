// Assembles the SeoPage[] for prerendering, mixing the editorial content
// registry with live catalog/location data from the database.
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { SeoPage, LinkItem } from "../../src/seo/types";
import { CATEGORY_CONTENT, CATEGORY_SLUGS } from "../../src/seo/content/categories";
import {
  cityIntro, citySections, cityFaq, type CityData,
} from "../../src/seo/content/locations";
import { article, de } from "../../src/seo/content/fr";
import { SERVICE_CONTENT } from "../../src/seo/content/services";
import {
  CITY_PROFILES, DEPT_PROFILES, CITY_OFFICIAL, DEPT_OFFICIAL, CCI_GRAND_EST,
  PRODUCT_CARDS, CATEGORY_LINKS_VARIED, SERVICE_LINKS_VARIED,
  HERO_CITY_IMAGES, deptHero,
} from "../../src/seo/content/local";
import {
  breadcrumbLd, collectionPageLd, serviceLd, webPageLd, faqLd,
} from "../../src/seo/schema";

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


const PRIORITY_CITIES = [
  "epinal", "nancy", "metz", "strasbourg", "colmar", "mulhouse", "reims",
  "troyes", "saint-die-des-vosges", "remiremont", "neufchateau", "luneville",
  "thionville", "sarreguemines", "verdun", "chaumont",
];
const PRIORITY_DEPARTMENTS: { slug: string; name: string; region: string }[] = [
  { slug: "vosges", name: "Vosges", region: "Grand Est" },
  { slug: "meurthe-et-moselle", name: "Meurthe-et-Moselle", region: "Grand Est" },
  { slug: "moselle", name: "Moselle", region: "Grand Est" },
  { slug: "bas-rhin", name: "Bas-Rhin", region: "Grand Est" },
  { slug: "haut-rhin", name: "Haut-Rhin", region: "Grand Est" },
  { slug: "haute-saone", name: "Haute-Saône", region: "Bourgogne-Franche-Comté" },
  { slug: "meuse", name: "Meuse", region: "Grand Est" },
  { slug: "marne", name: "Marne", region: "Grand Est" },
  { slug: "aube", name: "Aube", region: "Grand Est" },
  { slug: "haute-marne", name: "Haute-Marne", region: "Grand Est" },
];

const SERVICE_LINKS: LinkItem[] = [
  { label: "Impression numérique", path: "/impression-numerique" },
  { label: "Grand format", path: "/grand-format" },
  { label: "Supports publicitaires", path: "/supports-publicitaires" },
  { label: "Personnalisation", path: "/personnalisation" },
];

export async function buildAllPages(): Promise<SeoPage[]> {
  const cats = await rest<{ id: string; slug: string; name: string; parent_id: string | null }>(
    "product_categories?select=id,slug,name,parent_id",
  );
  const childrenOf = new Map<string, typeof cats>();
  for (const c of cats) if (c.parent_id) {
    if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
    childrenOf.get(c.parent_id)!.push(c);
  }

  const cityRows = await rest<CityData>(
    `cities?select=slug,name,department,region,cp&slug=in.(${PRIORITY_CITIES.join(",")})`,
  );

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
      pages.push({
        path: `/categorie/${slug}/${sub.slug}`,
        title: `${sub.name} — ${content.name}`,
        description: `${sub.name} : impression professionnelle en ligne (${content.name.toLowerCase()}). Formats, matières et finitions au choix, devis et livraison partout en France.`,
        h1: sub.name,
        intro: [angles[si % angles.length]],
        breadcrumb: subCrumb,
        cta: CATALOG_CTA,
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
        ],
      });
    });
  }

  // ── Cities (priority) ──
  for (const c of cityRows) {
    const crumb = [
      home,
      { name: "Zones desservies", path: "/imprimerie" },
      { name: c.region, path: `/departement/${slugify(c.region)}` },
      { name: c.department, path: `/departement/${slugify(c.department)}` },
      { name: c.name, path: `/ville/${c.slug}` },
    ];
    const cart = article(c.department);
    const faq = cityFaq(c);
    pages.push({
      path: `/ville/${c.slug}`,
      title: `Imprimerie en ligne à ${c.name} — livraison ${cart.de}`,
      description: `Impression professionnelle livrée à ${c.name} (${c.cp}) : flyers, cartes de visite, banderoles et PLV. Commande en ligne, livraison ${cart.dans}.`,
      h1: `Imprimerie en ligne pour ${c.name}`,
      intro: cityIntro(c),
      breadcrumb: crumb,
      sections: citySections(c),
      faq,
      internalLinks: [
        { heading: "Nos univers", links: CATEGORY_SLUGS.slice(0, 6).map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` })) },
        { heading: "Nos services", links: SERVICE_LINKS },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        webPageLd({ name: `Impression à ${c.name}`, description: `Impression en ligne livrée à ${c.name}.`, path: `/ville/${c.slug}` }),
        serviceLd({ name: `Impression pour les professionnels à ${c.name}`, description: `Impression en ligne avec livraison à ${c.name} et ${cart.dans}.`, areaServed: c.name }),
        faqLd(faq),
      ],
    });
  }

  // ── Departments (priority) ──
  for (const d of PRIORITY_DEPARTMENTS) {
    const crumb = [
      home,
      { name: "Zones desservies", path: "/imprimerie" },
      { name: d.region, path: `/departement/${slugify(d.region)}` },
      { name: d.name, path: `/departement/${d.slug}` },
    ];
    const citiesHere = cityRows.filter((c) => slugify(c.department) === d.slug);
    const art = article(d.name);
    pages.push({
      path: `/departement/${d.slug}`,
      title: `Impression en ligne ${art.dans} (${d.region})`,
      description: `Imprimerie en ligne livrant ${art.dans} : supports professionnels, prix transparents, commande à distance et livraison locale.`,
      h1: `Impression pour les entreprises ${art.de}`,
      intro: [
        `J2L Print accompagne les professionnels du département ${art.de} (${d.region}) avec une imprimerie en ligne complète : vous commandez à distance et nous livrons sur place.`,
        `Aucune boutique physique n'est nécessaire : la configuration, le paiement et la livraison se font en ligne ${art.dans}.`,
      ],
      breadcrumb: crumb,
      sections: [
        {
          heading: `Villes desservies ${art.dans}`,
          paragraphs: ["Nous livrons l'ensemble du département, notamment :"],
          bullets: citiesHere.map((c) => c.name),
        },
      ],
      internalLinks: [
        ...(citiesHere.length ? [{ heading: "Villes du département", links: citiesHere.map((c) => ({ label: c.name, path: `/ville/${c.slug}` })) }] : []),
        { heading: "Nos univers", links: CATEGORY_SLUGS.slice(0, 6).map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` })) },
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        webPageLd({ name: `Impression ${art.dans}`, description: `Impression en ligne livrée ${art.dans}.`, path: `/departement/${d.slug}` }),
        serviceLd({ name: `Impression ${art.dans}`, description: `Impression en ligne avec livraison ${art.dans}.`, areaServed: d.name }),
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
