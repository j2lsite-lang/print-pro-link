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
import { twinDisplayName } from "../../src/seo/data/twin-products";
import {
  loadProductAttributes, productAttributePhrases, productAttributeBullets,
  type ProductAttributes,
} from "./product-attributes";
import { loadProductPrices } from "./product-prices";
import { loadGeo } from "./geo-data";
import {
  SITE_KEYWORDS, cityKeywords, deptKeywords, regionKeywords,
  categoryKeywords, subcategoryKeywords, productKeywords,
} from "./geo-keywords";
import {
  sectorBullets, eventBullets, sectorEventKeywords,
  geoSectorBullets, geoEventBullets, zoneSectorBullets, zoneEventBullets,
} from "./sector-events";
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

const CATEGORY_VISUALS: Record<string, { image: string; alt: string }> = {
  "impression-papier": { image: "/seo/hero-flyers.jpg", alt: "Flyers, cartes et brochures imprimés" },
  "publicite-exterieure": { image: "/seo/hero-baches.jpg", alt: "Bâches, panneaux et supports extérieurs" },
  "publicite-interieure": { image: "/seo/hero-rollup.jpg", alt: "Roll-up et PLV pour espaces intérieurs" },
  "etiquettes-stickers": { image: "/seo/hero-autocollants.jpg", alt: "Stickers et étiquettes personnalisés" },
  "emballages-sacs": { image: "/seo/hero-emballages.jpg", alt: "Sacs et emballages personnalisés" },
  "objets-publicitaires-cadeaux": { image: "/seo/hero-objets.jpg", alt: "Objets publicitaires personnalisés" },
  "textiles-accessoires": { image: "/seo/hero-textiles.jpg", alt: "Textiles et accessoires personnalisés" },
  "panneaux-baches-vinyles-toiles": { image: "/seo/hero-panneaux.jpg", alt: "Panneaux rigides, bâches et vinyles imprimés" },
};

const FAMILY_VISUALS: Record<string, { image: string; alt: string }> = {
  flyer: { image: "/seo/hero-flyers.jpg", alt: "Flyers et dépliants imprimés" },
  affiche: { image: "/seo/hero-affiches.jpg", alt: "Affiches et posters imprimés" },
  carte: { image: "/seo/hero-cartes-visite.jpg", alt: "Cartes de visite et papeterie imprimées" },
  brochure: { image: "/seo/hero-brochures.jpg", alt: "Brochures, catalogues et magazines imprimés" },
  banner: { image: "/seo/hero-baches.jpg", alt: "Bâches et banderoles imprimées" },
  "roll-up": { image: "/seo/hero-rollup.jpg", alt: "Roll-up, kakémonos et PLV imprimés" },
  adhesif: { image: "/seo/hero-autocollants.jpg", alt: "Adhésifs, stickers et vinyles imprimés" },
  panneau: { image: "/seo/hero-panneaux.jpg", alt: "Panneaux rigides et signalétique imprimés" },
  "t-shirt": { image: "/seo/hero-textiles.jpg", alt: "Textiles personnalisés imprimés" },
  mug: { image: "/seo/hero-objets.jpg", alt: "Objets publicitaires personnalisés" },
  bottle: { image: "/seo/hero-objets.jpg", alt: "Gourdes et objets publicitaires personnalisés" },
  bag: { image: "/seo/hero-emballages.jpg", alt: "Sacs personnalisés imprimés" },
  menu: { image: "/seo/hero-brochures.jpg", alt: "Menus et supports papier imprimés" },
};

function visibleKeywords(entry?: SemanticEntry, fallback: string[] = []): string[] {
  if (!entry) return fallback.slice(0, 8);
  return [entry.primaryKeyword, ...entry.secondary, ...entry.longTail].filter(Boolean).slice(0, 8);
}

function ecosystemGroup(seed: number, n: number) {
  const links: LinkItem[] = [];
  const start = seed % J2L_ECOSYSTEM.length;
  for (let i = 0; i < Math.min(n, J2L_ECOSYSTEM.length); i++) {
    links.push(J2L_ECOSYSTEM[(start + i) % J2L_ECOSYSTEM.length]);
  }
  return { heading: "L'écosystème J2L", links };
}

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

/* ── Page éditoriale dédiée « kakémono » ─────────────────────────────────────
 * Intention de recherche forte (kakemono, L-banner, X-banner, kakémono
 * suspendu) non couverte par une sous-catégorie du catalogue. La page est
 * purement éditoriale : elle renvoie vers le catalogue existant, sans jamais
 * interférer avec l'API produits ni le configurateur. */
const KAKEMONO_PARENT = "publicite-interieure";
const KAKEMONO_SLUG = "kakemono";
const KAKEMONO_PATH = `/categorie/${KAKEMONO_PARENT}/${KAKEMONO_SLUG}`;

const KAKEMONO_FAQ = [
  {
    q: "Quelle différence entre un kakémono, un roll-up et un X-banner ?",
    a: "Le kakémono est une toile ou un film imprimé suspendu par des profilés haut et bas. Le roll-up intègre la toile dans une cassette enrouleuse posée au sol. Le X-banner est une bannière tendue sur une croisée de fibre de verre en X, très légère et repliable.",
  },
  {
    q: "Quels sont les formats de kakémono les plus courants ?",
    a: "Les formats les plus demandés sont 60 × 160 cm, 80 × 200 cm, 85 × 200 cm et 100 × 200 cm pour l'intérieur. Des formats sur mesure sont possibles en toile suspendue, notamment pour les hauteurs sous plafond importantes.",
  },
  {
    q: "Quelle résolution prévoir pour le fichier ?",
    a: "Prévoyez un fichier à l'échelle 1:1 en 100 à 150 dpi (ou à l'échelle 1:10 en 300 dpi), en CMJN, avec 3 mm de fonds perdus et les textes vectorisés. Gardez une marge basse de 10 à 15 cm : elle est souvent masquée par la cassette ou le pied.",
  },
  {
    q: "Sur quel support imprime-t-on un kakémono ?",
    a: "Le plus souvent sur toile polyester ou film polypropylène opaque pour l'intérieur, et sur bâche PVC pour les usages exposés. L'opacité évite la transparence du visuel côté verso.",
  },
  {
    q: "Un kakémono est-il réutilisable ?",
    a: "Oui. Les structures L-banner, X-banner et enrouleurs sont conçues pour être montées et démontées régulièrement, et la toile seule peut être remplacée pour changer de visuel sans racheter la structure.",
  },
  {
    q: "Comment obtenir un devis pour plusieurs kakémonos ?",
    a: "Configurez le produit en ligne pour un prix immédiat, ou envoyez votre demande via le formulaire de devis en précisant le format, la quantité et le type de structure : nous revenons vers vous avec un tarif dégressif.",
  },
];

const KAKEMONO_KEYWORDS = [
  "kakemono", "kakémono personnalisé", "impression kakemono", "kakemono publicitaire",
  "l banner", "x banner", "kakemono suspendu", "kakemono 80x200", "kakemono 85x200",
  "roll up kakemono", "kakemono sur mesure", "kakemono salon", "kakemono entreprise",
  "prix kakemono", "devis kakemono",
];

function kakemonoPage(home: BreadcrumbItemLite): SeoPage {
  const parent = CATEGORY_CONTENT[KAKEMONO_PARENT];
  const crumb = [
    home,
    { name: "Catalogue", path: "/catalogue" },
    { name: parent.name, path: `/categorie/${KAKEMONO_PARENT}` },
    { name: "Kakémono", path: KAKEMONO_PATH },
  ];
  return {
    path: KAKEMONO_PATH,
    title: "Kakémono personnalisé : L-banner, X-banner, suspendu",
    description:
      "Impression de kakémonos personnalisés : L-banner, X-banner, kakémono suspendu et enrouleur. Formats 60×160 à 100×200 cm, toile opaque, devis gratuit et livraison en France.",
    h1: "Kakémono personnalisé : L-banner, X-banner et kakémono suspendu",
    intro: [
      "Le kakémono est le support d'affichage vertical le plus utilisé en intérieur : léger, transportable et visible de loin, il structure un stand de salon, un hall d'accueil ou une opération commerciale en point de vente. Chez J2L Print, il s'imprime sur toile ou film opaque, à l'échelle 1:1, avec la structure de votre choix.",
      "Selon l'usage, trois familles cohabitent : le L-banner (structure en L, montage instantané), le X-banner (croisée en X, ultra-léger et repliable) et le kakémono suspendu, fixé par profilés haut et bas pour les grandes hauteurs. À cela s'ajoute l'enrouleur roll-up, qui protège la toile dans sa cassette entre deux événements.",
    ],
    visual: {
      image: "/seo/hero-rollup.jpg",
      imageAlt: "Kakémono personnalisé imprimé pour salon et point de vente",
      keywords: KAKEMONO_KEYWORDS.slice(0, 8),
    },
    sections: [
      {
        heading: "L-banner, X-banner, kakémono suspendu : lequel choisir ?",
        paragraphs: [
          "Le choix se fait sur trois critères : la fréquence d'utilisation, la hauteur disponible et le mode de fixation. Un support déplacé chaque semaine gagne à être protégé par une cassette ; un affichage permanent en hauteur se traite en toile suspendue.",
        ],
        bullets: [
          "L-banner : structure en L, pied stable, montage en moins d'une minute — idéal pour l'accueil et les corners éphémères.",
          "X-banner : croisée en fibre de verre, poids réduit, housse de transport — parfait pour les tournées commerciales et les salons.",
          "Kakémono suspendu : profilés haut et bas, fixation par câbles ou crochets — adapté aux halls, vitrines et grandes hauteurs.",
          "Enrouleur (roll-up) : toile rangée dans sa base, visuel protégé, changement de toile possible sans changer la structure.",
        ],
      },
      {
        heading: "Formats et supports d'impression",
        paragraphs: [
          "Les formats standards couvrent la majorité des besoins : 60 × 160 cm pour un espace réduit, 80 × 200 ou 85 × 200 cm en format passe-partout de salon, 100 × 200 cm pour un impact maximal. Le sur-mesure reste possible en toile suspendue.",
          "L'impression se fait en général sur toile polyester ou film polypropylène opaque de 200 à 510 g/m², choisis pour leur tenue à plat et l'absence de transparence. Pour un usage exposé ou semi-extérieur, la bâche PVC prend le relais.",
        ],
        bullets: [
          "Formats courants : 60 × 160, 80 × 200, 85 × 200, 100 × 200 cm",
          "Toile polyester ou film opaque pour l'intérieur, bâche PVC pour les usages exposés",
          "Impression quadri recto, finition anti-reflet possible selon le support",
          "Ourlets, œillets ou profilés selon le mode d'accroche",
        ],
      },
      {
        heading: "Préparer son fichier d'impression",
        paragraphs: [
          "Un kakémono se lit debout, à deux ou trois mètres : le message principal doit se situer dans le tiers supérieur, au-dessus de 120 cm du sol. Placez le logo en haut, l'appel à l'action en bas, et évitez les textes trop proches des bords.",
        ],
        bullets: [
          "PDF CMJN, échelle 1:1 en 100–150 dpi (ou 1:10 en 300 dpi)",
          "3 mm de fonds perdus, textes vectorisés, images liées incorporées",
          "Zone basse de 10 à 15 cm réservée à la cassette ou au pied",
          "Contraste fort entre le texte et le fond pour la lecture à distance",
        ],
      },
      {
        heading: "Usages professionnels",
        bullets: [
          "Salons, congrès et forums : signalétique de stand et présentation d'offre",
          "Points de vente : mise en avant d'une promotion, d'une nouveauté ou d'un service",
          "Halls d'accueil et espaces d'attente : présentation d'entreprise et valeurs",
          "Événements sportifs et associatifs : affichage des partenaires",
          "Agences, cabinets et showrooms : orientation des visiteurs et affichage tarifaire",
        ],
      },
    ],
    productGrid: {
      heading: "Configurer votre kakémono en ligne",
      intro: "Choisissez le format, le support et la quantité dans le catalogue : le prix s'affiche immédiatement.",
      cards: PRODUCT_CARDS,
    },
    cta: CATALOG_CTA,
    faq: KAKEMONO_FAQ,
    internalLinks: [
      {
        heading: "Catégorie",
        links: [{ label: parent.name, path: `/categorie/${KAKEMONO_PARENT}` }],
      },
      {
        heading: "Supports proches",
        links: [
          { label: "Roll-ups & enrouleurs", path: `/categorie/${KAKEMONO_PARENT}/roll-ups` },
          { label: "Stands & matériel d'expo", path: `/categorie/${KAKEMONO_PARENT}/stands-materiel-expo` },
          { label: "Présentoirs & matériel PLV", path: `/categorie/${KAKEMONO_PARENT}/presentoirs-materiel-plv` },
          { label: "Panneaux, bâches, vinyles et toiles", path: "/categorie/panneaux-baches-vinyles-toiles" },
          { label: "Publicité extérieure", path: "/categorie/publicite-exterieure" },
        ],
      },
      { heading: "Nos services", links: SERVICE_LINKS },
      {
        heading: "Passer à l'action",
        links: [
          { label: "Demander un devis kakémono", path: "/#devis" },
          { label: "Voir tout le catalogue", path: "/catalogue" },
        ],
      },
    ],
    jsonLd: [
      breadcrumbLd(crumb),
      webPageLd({
        name: "Kakémono personnalisé : L-banner, X-banner et kakémono suspendu",
        description:
          "Guide et impression de kakémonos personnalisés : structures L-banner, X-banner, suspendu et enrouleur, formats standards et sur mesure.",
        path: KAKEMONO_PATH,
      }),
      faqLd(KAKEMONO_FAQ),
    ],
    breadcrumb: crumb,
    keywords: KAKEMONO_KEYWORDS,
  };
}

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
  // Count subcategory NAME occurrences across the whole tree so we can make
  // colliding H1s unique (e.g. "Panneaux & accessoires" exists in 3 parents).
  const subNameCount = new Map<string, number>();
  for (const c of cats) if (c.parent_id) {
    const k = c.name.trim().toLowerCase();
    subNameCount.set(k, (subNameCount.get(k) || 0) + 1);
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
      {
        heading: "Supports à la une",
        links: [{ label: "Kakémono personnalisé (L-banner, X-banner, suspendu)", path: KAKEMONO_PATH }],
      },
    ],
    // Organization JSON-LD lives once in the static index.html shell (sitewide);
    // don't re-emit it here or the homepage would carry a duplicate.
    jsonLd: [],
    keywords: SITE_KEYWORDS,
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
    visual: {
      image: "/seo/hero-atelier.jpg",
      imageAlt: "Supports d'impression personnalisés J2L Print",
      keywords: SITE_KEYWORDS.slice(0, 8),
    },
    productGrid: {
      heading: "Supports les plus demandés",
      intro: "Un aperçu des produits les plus commandés. Cliquez pour configurer le vôtre.",
      cards: PRODUCT_CARDS,
    },
    internalLinks: [
      { heading: "Catégories", links: CATEGORY_SLUGS.map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` })) },
      ecosystemGroup(seedFrom("catalogue"), 2),
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
    keywords: SITE_KEYWORDS,
  });

  // ── 8 categories ──
  for (const slug of CATEGORY_SLUGS) {
    const content = CATEGORY_CONTENT[slug];
    const entry = CATEGORY_KEYWORDS[slug];
    const catSeed = seedFrom(slug);
    const cat = cats.find((c) => c.slug === slug && !c.parent_id);
    const subs = (cat && childrenOf.get(cat.id)) || [];
    const crumb = [home, { name: "Catalogue", path: "/catalogue" }, { name: content.name, path: `/categorie/${slug}` }];
    const subLinks: LinkItem[] = subs.map((s) => ({ label: s.name, path: `/categorie/${slug}/${s.slug}` }));
    // Page éditoriale dédiée (hors arborescence catalogue) : kakémono.
    if (slug === KAKEMONO_PARENT) {
      subLinks.unshift({ label: "Kakémono (L-banner, X-banner, suspendu)", path: KAKEMONO_PATH });
    }
    const relatedCats: LinkItem[] = CATEGORY_SLUGS.filter((s) => s !== slug).slice(0, 4)
      .map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` }));
    // Complementary universes from the semantic map (always valid category links).
    const complementaryCats: LinkItem[] = entry
      ? entry.complementary.filter((s) => CATEGORY_CONTENT[s] && s !== slug)
          .map((s) => ({ label: CATEGORY_CONTENT[s].name, path: `/categorie/${s}` }))
      : [];

    // Enrich existing content WITHOUT changing the URL: append semantic sections
    // and extend the FAQ to 6–10 entries (deduped). Fully seeded for variety.
    const sections = entry ? [...content.sections, ...categorySemanticSections(entry, catSeed)] : content.sections;
    const faq = entry ? mergeFaq([content.faq, entry.faq], 10) : content.faq;

    pages.push({
      path: `/categorie/${slug}`,
      title: fitTitle(content.name, [content.title, `${content.name} personnalisés | J2L Print`], 60),
      description: content.description,
      h1: content.h1,
      intro: content.intro,
      breadcrumb: crumb,
      visual: CATEGORY_VISUALS[slug] ? {
        image: CATEGORY_VISUALS[slug].image,
        imageAlt: CATEGORY_VISUALS[slug].alt,
        keywords: visibleKeywords(entry),
      } : undefined,
      sections,
      productGrid: {
        heading: "Produits populaires",
        intro: "Une sélection de supports parmi les plus demandés. Cliquez pour configurer le vôtre dans le catalogue en ligne.",
        cards: PRODUCT_CARDS,
      },
      faq,
      cta: CATALOG_CTA,
      internalLinks: [
        ...(subLinks.length ? [{ heading: "Sous-catégories", links: subLinks }] : []),
        ...(complementaryCats.length ? [{ heading: "Univers complémentaires", links: complementaryCats }] : []),
        { heading: "Catégories associées", links: relatedCats },
        { heading: "Nos services", links: SERVICE_LINKS },
        ecosystemGroup(catSeed, 2),
      ],
      jsonLd: [
        breadcrumbLd(crumb),
        collectionPageLd({
          name: content.name,
          description: content.description,
          path: `/categorie/${slug}`,
          items: subs.map((s) => ({ name: s.name, path: `/categorie/${slug}/${s.slug}` })),
        }),
        faqLd(faq),
      ],
      ...(entry ? { keywords: categoryKeywords(entry) } : {}),
    });

    // ── Subcategories: rich editorial text + internal links + a button toward
    //    the existing catalog. They never fetch, embed, rebuild or intercept the
    //    Print.com catalog/configurator — they only link to /products.
    subs.forEach((sub, si) => {
      const subCrumb = [...crumb, { name: sub.name, path: `/categorie/${slug}/${sub.slug}` }];
      // Prefer a precise product-family universe detected from the sub name;
      // fall back to the parent category universe.
      const famKey = detectFamily(sub.name);
      const subEntry: SemanticEntry = (famKey && FAMILY_KEYWORDS[famKey]) || entry || CATEGORY_KEYWORDS[slug];
      const subSeed = seedFrom(sub.slug);
      const angles = [
        `Découvrez la sélection « ${sub.name} » de J2L Print, au sein de l'univers ${content.name}. ${cap1(subEntry.primaryKeyword)} à configurer en ligne — format, support et finitions — avec livraison partout en France.`,
        `Pour vos besoins en « ${sub.name} », J2L Print propose une gamme professionnelle (${subEntry.primaryKeyword}) avec un rendu fidèle, des finitions au choix et des tarifs dégressifs.`,
        `La rubrique « ${sub.name} » regroupe nos produits ${content.name.toLowerCase()} adaptés à cet usage : ${frList(pickN(subEntry.usages, subSeed, 2).map((u) => u.toLowerCase()))}. Configurez vos options en ligne.`,
      ];
      const near = subLinks.filter((l) => !l.path.endsWith(`/${sub.slug}`)).slice(0, 6);
      const subSecs = subcategorySections(subEntry, sub.name, subSeed);
      const subFaq = subcategoryFaq(subEntry, sub.name, subSeed);
      const subVisual = (famKey && FAMILY_VISUALS[famKey]) || CATEGORY_VISUALS[slug];
      // Make H1 unique when the same subcategory name exists under several
      // parent categories (append the parent universe — real, factual context).
      const subH1 = (subNameCount.get(sub.name.trim().toLowerCase()) || 0) > 1
        ? `${sub.name} — ${content.name}`
        : sub.name;
      pages.push({
        path: `/categorie/${slug}/${sub.slug}`,
        title: fitTitle(sub.name, [
          `${sub.name} — ${content.name} | J2L Print`,
          `${sub.name} — ${content.name}`,
          `${sub.name} personnalisés | J2L Print`,
        ], 60),
        description: `${sub.name} : impression professionnelle en ligne (${content.name.toLowerCase()}). Formats, supports et finitions au choix, devis et livraison partout en France.`,
        h1: subH1,
        intro: [angles[si % angles.length]],
        breadcrumb: subCrumb,
        visual: subVisual ? {
          image: subVisual.image,
          imageAlt: `${subVisual.alt} — ${sub.name}`,
          keywords: visibleKeywords(subEntry, subcategoryKeywords(subEntry, sub.name, subSeed)),
        } : undefined,
        sections: subSecs,
        productGrid: {
          heading: `Produits disponibles dans « ${sub.name} »`,
          intro: "Configurez votre produit dans le catalogue en ligne.",
          cards: PRODUCT_CARDS,
        },
        cta: CATALOG_CTA,
        faq: subFaq,
        internalLinks: [
          { heading: "Catégorie", links: [{ label: content.name, path: `/categorie/${slug}` }] },
          ...(near.length ? [{ heading: "Sous-catégories proches", links: near }] : []),
          { heading: "Nos services", links: SERVICE_LINKS },
          ecosystemGroup(subSeed, 1),
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
        keywords: subcategoryKeywords(subEntry, sub.name, subSeed),
      });
    });
  }

  // ── Page éditoriale dédiée « kakémono » (hors arborescence catalogue) ──
  pages.push(kakemonoPage(home));

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
      title: fitTitle(gc.name, [
        copy.title,
        `Imprimeur en ligne à ${gc.name}${gen.cp ? ` (${gen.cp})` : ""} | J2L Print`,
        `Impression à ${gc.name}${gen.cp ? ` (${gen.cp})` : ""} | J2L Print`,
      ], 60),
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
      sections: [
        ...copy.sections,
        { heading: `Professionnels accompagnés à ${gc.name}${gc.departmentCode ? ` (${gc.departmentName}, ${gc.departmentCode})` : ""}`, bullets: geoSectorBullets(gc.name, seedOf(gc.slug), 8) },
        { heading: `Occasions fréquentes à ${gc.name}`, bullets: geoEventBullets(gc.name, seedOf(gc.slug), 5) },
      ],
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
      keywords: cityKeywords(gc.name, { department: gc.departmentName, code: (gc as any).departmentCode, region: gc.regionName }),
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
      title: fitTitle(gd.name, [
        copy.title,
        `Imprimeur ${gd.code ? `(${gd.code}) ` : ""}${gd.name} | J2L Print`,
        `Impression ${gd.name} | J2L Print`,
      ], 60),
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
      sections: [
        ...copy.sections,
        { heading: `Professionnels accompagnés ${article(gd.name).dans}${gd.code ? ` (${gd.code})` : ""}`, bullets: zoneSectorBullets(article(gd.name).dans, seedOf(gd.slug), 8) },
        { heading: `Occasions fréquentes ${article(gd.name).dans}`, bullets: zoneEventBullets(article(gd.name).dans, seedOf(gd.slug), 5) },
      ],
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
      keywords: deptKeywords(gd.name, article(gd.name).dans, gd.code),
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
      title: fitTitle(gr.name, [
        copy.title,
        `Imprimeur en ligne ${gr.name} | J2L Print`,
        `Impression ${gr.name} | J2L Print`,
      ], 60),
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
      sections: [
        ...copy.sections,
        { heading: `Professionnels accompagnés ${art.dans}`, bullets: zoneSectorBullets(art.dans, seedOf(gr.slug), 8) },
        { heading: `Occasions fréquentes ${art.dans}`, bullets: zoneEventBullets(art.dans, seedOf(gr.slug), 5) },
      ],
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
      keywords: regionKeywords(gr.name, art.dans),
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
      title: fitTitle(svc.name, [svc.title, `${svc.name} en ligne | J2L Print`], 60),
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

  // ── Garde d'unicité globale ───────────────────────────────────────────
  // Garantit que chaque page a un title, une meta description et une intro
  // uniques, même pour les territoires/villes jumeaux qui partagent un même
  // nom de base (Martinique dépt/région, Saint-Paul/Saint-Pierre Réunion,
  // sous-catégories homonymes…). On ne réécrit que les pages réellement en
  // collision, avec un discriminant local et naturel.
  const uniqCtx = (p: SeoPage): string => {
    const s = p.path.split("/").filter(Boolean);
    if (s[0] === "ville") {
      const c = cityBySlug.get(s[1]);
      if (c && c.postalCodes.length) return `(${c.postalCodes.join(", ")})`;
      if (c) return `(${c.departmentName})`;
    }
    if (s[0] === "departement") {
      const d = deptBySlug.get(s[1]);
      if (d) return `(département ${d.code})`;
    }
    if (s[0] === "region") return "(région)";
    if (s[0] === "categorie" && s.length === 3) {
      const parent = p.breadcrumb?.[p.breadcrumb.length - 2]?.name;
      if (parent) return `(${parent})`;
    }
    return "";
  };
  const stampField = (field: "title" | "description") => {
    const groups = new Map<string, SeoPage[]>();
    for (const p of pages) {
      const k = (p[field] || "").trim().toLowerCase();
      if (!k) continue;
      const g = groups.get(k);
      if (g) g.push(p); else groups.set(k, [p]);
    }
    for (const grp of groups.values()) {
      if (grp.length < 2) continue;
      for (const p of grp) {
        const c = uniqCtx(p);
        if (c && !p[field].includes(c)) p[field] = `${p[field]} ${c}`;
      }
    }
  };
  stampField("title");
  stampField("description");
  // Intro (tableau de paragraphes) : différencie les pages dont le contenu
  // visible serveur serait identique en ajoutant une phrase de contexte local.
  const introGroups = new Map<string, SeoPage[]>();
  for (const p of pages) {
    const k = (p.intro || []).join(" ").trim().toLowerCase();
    if (!k) continue;
    const g = introGroups.get(k);
    if (g) g.push(p); else introGroups.set(k, [p]);
  }
  for (const grp of introGroups.values()) {
    if (grp.length < 2) continue;
    for (const p of grp) {
      const bc = p.breadcrumb || [];
      const self = bc[bc.length - 1]?.name;
      const parent = bc[bc.length - 2]?.name;
      if (self && parent) {
        p.intro = [...(p.intro || []), `Retrouvez « ${self} » au sein de notre univers ${parent}, avec configuration en ligne et devis personnalisé.`];
      }
    }
  }

  // Dernier garde-fou SERP : meta description <= 158 caractères, coupée sur une
  // phrase complète (jamais en plein mot) et sans jamais créer de doublon.
  const seenDesc = new Set(pages.map((p) => p.description));
  for (const p of pages) {
    if (p.description.length <= 158) continue;
    const short = truncate(p.description, 158);
    if (short.length >= 90 && !seenDesc.has(short)) {
      seenDesc.delete(p.description);
      seenDesc.add(short);
      p.description = short;
    }
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

/* --------------------------------------------------------------------------
 * Produit : paragraphe « Qualité d'impression et finitions » construit à
 * partir des caractéristiques RÉELLES du SKU (Print.com). Aucun délai, prix
 * ou caractéristique inventé : chaque bribe provient de `attrs`.
 * ------------------------------------------------------------------------ */
function realQualityParagraph(
  name: string,
  attrs: ProductAttributes | undefined,
  seed: number,
  fallback: string,
  universe: string,
): string {
  const varied = () => {
    // Pas d'attributs API : on varie sur le nom réel + l'univers réel.
    const openers = [
      `${name} est imprimé et façonné dans nos ateliers partenaires`,
      `Chaque ${name.toLowerCase()} est produit par un imprimeur partenaire sélectionné`,
      `La production de ${name.toLowerCase()} est confiée à un atelier spécialisé`,
      `${name} est fabriqué sur commande`,
    ];
    const tails = [
      "avec un contrôle de votre fichier PDF avant lancement.",
      "après vérification de votre fichier PDF et de vos options.",
      "avec relecture technique du fichier fourni avant impression.",
      "et un contrôle visuel de la commande avant expédition.",
    ];
    const uni = universe ? ` Ce produit relève de notre univers ${universe.replace(/-/g, " ")}.` : "";
    return `${openers[Math.abs(seed) % openers.length]} ${tails[Math.abs(seed >> 2) % tails.length]}${uni} Le délai exact est affiché lors de la configuration.`;
  };
  if (!attrs) return varied();

  const bits: string[] = [];
  if (attrs.matieres.length) {
    bits.push(`sur ${attrs.matieres.slice(0, 3).map((m) => m.toLowerCase()).join(", ")}`);
  }
  if (attrs.grammageMin && attrs.grammageMax) {
    bits.push(
      attrs.grammageMin === attrs.grammageMax
        ? `en ${attrs.grammageMin} g/m²`
        : `en grammages de ${attrs.grammageMin} à ${attrs.grammageMax} g/m²`,
    );
  }
  if (attrs.faces.length) bits.push(`en ${attrs.faces.join(" ou ")}`);

  const fin: string[] = [];
  for (const p of attrs.pelliculage) fin.push(`pelliculage ${p}`);
  if (attrs.vernis.length) fin.push("vernis sélectif");
  if (attrs.dorure) fin.push("dorure");
  if (attrs.coinsArrondis) fin.push("coins arrondis");
  if (attrs.decoupe) fin.push("découpe à la forme");
  if (attrs.oeillets) fin.push("œillets");

  const sentences: string[] = [];
  if (bits.length) {
    const heads = [
      `${name} est imprimé`,
      `Nous produisons ${name.toLowerCase()}`,
      `La fabrication de ${name.toLowerCase()} se fait`,
    ];
    sentences.push(`${heads[Math.abs(seed) % heads.length]} ${frList(bits)}.`);
  }
  if (fin.length) {
    sentences.push(
      fin.length === 1
        ? `Finition disponible sur ce produit : ${fin[0]}.`
        : `Finitions réellement disponibles : ${frList(fin)}.`,
    );
  }
  if (attrs.formats.length > 1) {
    sentences.push(`${attrs.formats.length} formats sont proposés, dont ${attrs.formats.slice(0, 3).join(", ")}.`);
  }
  const qs = attrs.quantities || [];
  if (qs.length > 1) {
    sentences.push(`Les quantités vont de ${qs[0]} à ${qs[qs.length - 1]} exemplaires, avec un tarif dégressif.`);
  }
  if (attrs.exterieur) sentences.push("Les matières retenues sont adaptées à un usage extérieur.");
  if (!sentences.length) return varied();
  if (!sentences[0].toLowerCase().includes(name.toLowerCase().slice(0, 12))) {
    const heads2 = [
      `${name} est produit sur commande par notre imprimeur partenaire.`,
      `Chaque ${name.toLowerCase()} est fabriqué à la commande.`,
      `${name} est réalisé d'après le fichier que vous fournissez.`,
    ];
    sentences.unshift(heads2[Math.abs(seed) % heads2.length]);
  }
  sentences.push("Votre fichier PDF est vérifié avant impression et le délai est affiché lors de la configuration.");
  return sentences.join(" ");
}

/* --------------------------------------------------------------------------
 * Produit : FAQ enrichie avec les caractéristiques RÉELLES du SKU.
 * ------------------------------------------------------------------------ */
function realProductFaq(
  name: string,
  lower: string,
  attrs: ProductAttributes | undefined,
  famFaq: { q: string; a: string }[],
  sectors: string[],
  events: string[],
): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  if (attrs) {
    if (attrs.formats.length) {
      out.push({
        q: `Quels formats sont disponibles pour ${lower} ?`,
        a: `Les formats proposés sont : ${attrs.formats.slice(0, 8).join(", ")}. Sélectionnez le vôtre en ligne, avec un devis gratuit sur demande.`,
      });
    }
    if ((attrs.dimensions || []).length) {
      out.push({
        q: `Quelles dimensions exactes pour ${lower} ?`,
        a: `Les dimensions réellement proposées sont : ${(attrs.dimensions || []).slice(0, 6).join(", ")}. Elles s'affichent au moment de la configuration.`,
      });
    }
    if ((attrs.grammages || []).length > 1) {
      out.push({
        q: `Quels grammages sont proposés pour ${lower} ?`,
        a: `Les grammages disponibles sont : ${(attrs.grammages || []).join(", ")} g/m². Un grammage plus élevé donne un support plus rigide.`,
      });
    } else if (attrs.grammageMin && attrs.grammageMax && attrs.grammageMin !== attrs.grammageMax) {
      out.push({
        q: `Quel grammage choisir pour ${lower} ?`,
        a: `Ce produit est proposé de ${attrs.grammageMin} à ${attrs.grammageMax} g/m². Le choix se fait directement dans le configurateur.`,
      });
    }
    if (attrs.matieres.length) {
      out.push({
        q: `Sur quelles matières ${lower} est-il imprimé ?`,
        a: `Les supports disponibles sont : ${attrs.matieres.join(", ")}.${attrs.exterieur ? " Certaines matières conviennent à un usage extérieur." : ""}`,
      });
    }
    const fin: string[] = [];
    for (const p of attrs.pelliculage) fin.push(`pelliculage ${p}`);
    if (attrs.vernis.length) fin.push("vernis sélectif");
    if (attrs.dorure) fin.push("dorure");
    if (attrs.coinsArrondis) fin.push("coins arrondis");
    if (attrs.decoupe) fin.push("découpe à la forme");
    if (attrs.oeillets) fin.push("œillets");
    if (fin.length) {
      out.push({
        q: `Quelles finitions sont possibles sur ${lower} ?`,
        a: `Finitions réellement disponibles : ${fin.join(", ")}. Elles se sélectionnent dans le configurateur, le prix se met à jour immédiatement.`,
      });
    }
    const qs = attrs.quantities || [];
    if (qs.length > 1) {
      out.push({
        q: `Quelle quantité minimum pour ${lower} ?`,
        a: `Les quantités proposées vont de ${qs[0]} à ${qs[qs.length - 1]} exemplaires (dont ${qs.slice(0, 5).join(", ")}), avec un tarif dégressif sur les volumes.`,
      });
    }
    if (attrs.faces.includes("recto verso")) {
      out.push({
        q: `${name} peut-il être imprimé recto verso ?`,
        a: `Oui : ce produit est proposé en ${attrs.faces.join(" ou ")}. L'option se choisit en ligne avant l'ajout au panier.`,
      });
    }
  }
  if (sectors.length) {
    out.push({
      q: `Qui commande ${lower} ?`,
      a: `Principalement : ${sectors.slice(0, 3).map((s) => s.split(" :")[0].toLowerCase()).join(", ")}.`,
    });
  }
  if (events.length) {
    out.push({
      q: `Pour quelles occasions utiliser ${lower} ?`,
      a: `Notamment : ${events.slice(0, 3).map((e) => e.split(" :")[0].toLowerCase()).join(", ")}.`,
    });
  }
  const seen = new Set<string>();
  const merged: { q: string; a: string }[] = [];
  for (const f of [...out, ...famFaq]) {
    const k = f.q.trim().toLowerCase();
    if (!seen.has(k)) { seen.add(k); merged.push(f); }
  }
  return merged.slice(0, 6);
}

/**
 * Univers pour lesquels l'intention « publicitaire » est réellement
 * pertinente (PLV, signalétique, textile, goodies, adhésifs de communication).
 * Volontairement EXCLUS : impression-papier administrative et emballages-sacs.
 */
const AD_UNIVERSES = new Set([
  "objets-publicitaires-cadeaux",
  "textiles-accessoires",
  "publicite-exterieure",
  "publicite-interieure",
  "panneaux-baches-vinyles-toiles",
  "etiquettes-stickers",
]);
/** Familles papier où « publicitaire » reste exact (support de communication). */
const AD_PRINT_FAMILIES = new Set([
  "flyer", "affiche", "brochure", "roll-up", "banner", "panneau", "adhesif",
]);

function truncate(s: string, max = 158): string {

  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  // Prefer keeping whole sentences (no mid-word cut, no ellipsis in SERP).
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > max) break;
    out = next;
  }
  if (out.length >= Math.min(80, max * 0.5)) return out;
  // Fallback: cut on a word boundary and close the sentence cleanly.
  const cut = clean.slice(0, max).replace(/[\s,;:–-]+\S*$/, "").replace(/[.,;:–-]+$/, "");
  return `${cut}.`;
}

/** Builds a SERP-safe title (<= max chars) without ever cutting mid-word. */
function fitTitle(name: string, variants: string[], max = 60): string {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  // Le rendu ajoute " | J2L Print" quand la marque est absente : on mesure la
  // longueur réellement affichée dans les SERP.
  const rendered = (s: string) => (s.includes("J2L Print") ? s : `${s} | J2L Print`);
  for (const variant of variants) {
    const v = clean(variant);
    if (rendered(v).length <= max) return v;
  }

  const short = clean(`${name} | J2L Print`);
  if (short.length <= max) return short;
  const suffix = " | J2L Print";
  const room = max - suffix.length;
  const full = clean(name);
  // Le qualificatif final (après " - " ou " – ") distingue souvent deux produits
  // jumeaux (offset/digital vs jet d'encre). On le conserve en priorité.
  const parts = full.split(/\s[–-]\s/);
  if (parts.length > 1) {
    const qualifier = parts[parts.length - 1].trim();
    const head = parts.slice(0, -1).join(" - ").trim();
    const sep = " – ";
    const headRoom = room - qualifier.length - sep.length;
    if (headRoom >= 12) {
      const cutHead = head.slice(0, headRoom).replace(/[\s,;:–-]+\S*$/, "");
      return `${cutHead}${sep}${qualifier}${suffix}`;
    }
  }
  const trimmedName = full.slice(0, room).replace(/[\s,;:–-]+\S*$/, "");
  return `${trimmedName}${suffix}`;
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

  // Resolve the TOP category id of a SKU (for sibling/complementary products).
  const topIdOf = (sku: string): string | undefined => {
    const ids = skuCategories.get(sku) || [];
    const resolved = ids.map((id) => catById.get(id)).filter(Boolean) as typeof cats;
    const sub = resolved.find((c) => c.parent_id);
    const top = sub ? catById.get(sub.parent_id!) : resolved.find((c) => !c.parent_id);
    return top?.id;
  };
  // Group public SKUs by top category → real, existing complementary products.
  const skusByTop = new Map<string, string[]>();
  for (const sku of publicSkus) {
    const key = topIdOf(sku) || "_uncat";
    if (!skusByTop.has(key)) skusByTop.set(key, []);
    skusByTop.get(key)!.push(sku);
  }

  // Real Print.com attributes (formats, faces, matières, finitions…) for every
  // public SKU. Cached + refreshed defensively; drives factual, non-invented
  // long-tail SEO expressions and a visible "Formats et options" block.
  const attrMap = await loadProductAttributes(publicSkus, SB, ANON);

  // Real HT price for each product's DEFAULT configuration (identical to the
  // configurator). Cached + refreshed defensively; drives the Product JSON-LD
  // `offers` block. Never alters visible prices, the cart or the quote flow.
  const priceMap = await loadProductPrices(publicSkus, SB, ANON);

  for (const sku of publicSkus) {
    const prod = catalog.get(sku)!;
    // Unique, factual display name for twin SKUs that share an identical
    // catalog name (prevents duplicate title/description/H1/intro).
    const name = twinDisplayName(sku, prod.name || sku);
    const seo = getProductSEOData(name, sku);
    const crumb = productCrumb(sku, name);
    const path = `/products/${sku}`;
    const lower = name.toLowerCase();
    const seed = seedFrom(sku);

    // Real, factual attributes from the Print.com API (never invented).
    const attrs: ProductAttributes | undefined = attrMap.get(sku);
    const attrBullets = attrs ? productAttributeBullets(attrs) : [];
    const attrPhrases = attrs ? productAttributePhrases(attrs, seed) : [];

    // Univers réel du produit (catégorie racine) → métiers & occasions.
    const topSlugEarly = crumb.find((c) => c.path.startsWith("/categorie/"))?.path.split("/")[2] || "";
    const secBullets = sectorBullets(topSlugEarly, seed, 5);
    const evtBullets = eventBullets(topSlugEarly, seed, 3);

    const sections = [
      { heading: `À quoi sert votre ${lower} ?`, paragraphs: [seo.useCases] },
      // Real formats / faces / matières / finitions available for THIS product.
      ...(attrBullets.length >= 2
        ? [{ heading: "Formats et options disponibles", bullets: attrBullets }]
        : []),
      { heading: "Qualité d'impression et finitions", paragraphs: [realQualityParagraph(name, attrs, seed, seo.quality, topSlugEarly)] },
      // Visible file-preparation advice — masked when data is insufficient.
      ...(seo.fileTips && seo.fileTips.length >= 3
        ? [{ heading: "Conseils pour préparer votre fichier", bullets: seo.fileTips }]
        : []),
      ...(secBullets.length
        ? [{ heading: `Professionnels qui commandent ${lower}`, bullets: secBullets }]
        : []),
      ...(evtBullets.length
        ? [{ heading: "Occasions et événements concernés", bullets: evtBullets }]
        : []),
    ];

    const related = crumb
      .filter((c) => c.path.startsWith("/categorie/"))
      .map((c) => ({ label: c.name, path: c.path }));

    // Complementary products: 2–6 REAL sibling products (same top category),
    // seeded for variety, excluding self. Every link is a prerendered product
    // page → no 404. Block is omitted when fewer than 2 siblings exist.
    const siblings = (skusByTop.get(topIdOf(sku) || "_uncat") || []).filter((s) => s !== sku);
    const compCount = siblings.length >= 6 ? 6 : siblings.length;
    const complementaryProducts = compCount >= 2
      ? pickN(siblings, seed, compCount).map((s) => ({ label: catalog.get(s)!.name || s, path: `/products/${s}` }))
      : [];

    // Commercial & seeded title/meta so snippets stay unique, vendeurs and
    // never reduced to a raw SKU.
    // Commercial intent depends on the REAL product family: a printed support
    // ("imprimer / impression") vs. a goodie or a textile ("personnalisé /
    // marquage / avec logo"). Prevents "Imprimer un stylo en ligne".
    const topSlug = crumb.find((c) => c.path.startsWith("/categorie/"))?.path.split("/")[2] || "";
    // Intention « publicitaire » : appliquée UNIQUEMENT aux univers et
    // familles où elle est factuellement exacte (PLV, signalétique, adhésifs
    // de communication, textile, goodies) — jamais aux emballages ni aux
    // imprimés administratifs.
    const famKey = detectFamily(name, sku);
    const adRelevant =
      AD_UNIVERSES.has(topSlug) || (famKey ? AD_PRINT_FAMILIES.has(famKey) : false);
    const intent: "print" | "goodie" | "textile" =
      topSlug === "objets-publicitaires-cadeaux" ? "goodie"
        : topSlug === "textiles-accessoires" ? "textile"
        : "print";

    const titleVariants =
      intent === "goodie"
        ? [
            `${name} personnalisé | Devis gratuit – J2L Print`,
            `${name} publicitaire à personnaliser | J2L Print`,
            `${name} avec logo – Objet publicitaire | J2L Print`,
            `${name} personnalisable en ligne | J2L Print`,
          ]
        : intent === "textile"
        ? [
            `${name} personnalisé | Devis gratuit – J2L Print`,
            `${name} avec logo – Textile personnalisé | J2L Print`,
            `${name} personnalisable en ligne | J2L Print`,
            `${name} floqué ou brodé sur mesure | J2L Print`,
          ]
        : adRelevant
        ? [
            `${name} publicitaire personnalisé | J2L Print`,
            `${name} publicitaire sur mesure – Impression | J2L Print`,
            `${name} pas cher à personnaliser | J2L Print`,
            `Imprimer ${lower} publicitaire en ligne – J2L Print`,
          ]
        : [
            `${name} personnalisé | Devis gratuit – J2L Print`,
            `${name} sur mesure – Impression en ligne | J2L Print`,
            `${name} pas cher à personnaliser | J2L Print`,
            `Imprimer ${lower} en ligne – J2L Print`,
          ];
    const descVariants =
      intent === "goodie"
        ? [
            `Commandez ${lower} personnalisé avec votre logo : coloris et options de marquage au choix. Prix immédiat, devis gratuit et livraison partout en France.`,
            `${name} publicitaire à personnaliser selon vos besoins : configuration en ligne, tarif dégressif et livraison en France.`,
            `Besoin de ${lower} publicitaire ? Personnalisez-le en quelques clics : options sur mesure, prix transparent et devis gratuit.`,
            `${name} personnalisable avec votre logo par J2L Print. Choisissez vos options, obtenez un prix immédiat et un accompagnement dédié.`,
          ]
        : intent === "textile"
        ? [
            `Commandez ${lower} personnalisé avec votre logo : tailles, coloris et marquage au choix. Prix immédiat, devis gratuit et livraison en France.`,
            `${name} à personnaliser pour vos équipes ou vos événements : configuration en ligne, tarif dégressif et livraison partout en France.`,
            `Besoin de ${lower} personnalisé ? Choisissez tailles, coloris et marquage en ligne, avec un prix transparent et un devis gratuit.`,
            `${name} personnalisé avec votre logo par J2L Print. Sélectionnez vos options, obtenez un prix immédiat et profitez d'un suivi dédié.`,
          ]
        : adRelevant
        ? [
            `Commandez ${lower} publicitaire personnalisé en ligne : formats, matières et finitions au choix. Prix immédiat et devis gratuit.`,
            `${name} publicitaire à personnaliser selon vos besoins : configuration en ligne, tarif dégressif et livraison partout en France.`,
            `Besoin de ${lower} publicitaire ? Choisissez vos options en ligne : prix transparent, devis gratuit et expédition soignée.`,
            `${name} publicitaire imprimé sur mesure par J2L Print. Sélectionnez vos options et obtenez un prix immédiat.`,
          ]
        : [
            `Commandez ${lower} personnalisé en ligne : formats, matières et finitions au choix. Prix immédiat, devis gratuit et livraison partout en France.`,
            `${name} de qualité professionnelle à personnaliser selon vos besoins. Configuration en ligne, tarif dégressif, fichiers vérifiés et livraison en France.`,
            `Besoin de ${lower} ? Créez le vôtre en quelques clics : options sur mesure, prix transparent, devis gratuit et expédition soignée partout en France.`,
            `${name} imprimé sur mesure par J2L Print. Choisissez vos options, obtenez un prix immédiat et profitez d'un accompagnement et d'une livraison France entière.`,
          ];
    const seededTitles = [
      titleVariants[seed % titleVariants.length],
      ...[...titleVariants].sort((a, b) => a.length - b.length),
      `${name} personnalisé | J2L Print`,
    ];
    const title = fitTitle(name, seededTitles, 60);
    const description = truncate(descVariants[seed % descVariants.length], 158);


    // Extra intro paragraph built ONLY from real available attributes.
    const specSentence = attrs ? (() => {
      const bits: string[] = [];
      if (attrs.formats.length) bits.push(`formats ${attrs.formats.slice(0, 4).join(", ")}`);
      if (attrs.faces.includes("recto verso")) bits.push("impression recto ou recto verso");
      if (attrs.pelliculage.length) bits.push(`pelliculage ${attrs.pelliculage.join(", ")}`);
      if (attrs.dorure) bits.push("dorure");
      if (attrs.exterieur) bits.push("usage extérieur résistant");
      return bits.length ? `Options réellement disponibles : ${frList(bits)}. Configurez le tout en ligne pour un prix immédiat.` : "";
    })() : "";
    const productIntro = specSentence ? [seo.intro, specSentence] : [seo.intro];

    // FAQ enriched with a real-formats question when we have the data.
    const productFaq = realProductFaq(name, lower, attrs, seo.faq, secBullets, evtBullets);

    // Merge name-based + attribute-derived keywords (deduped, order-stable).
    const productKw = (() => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const v of [...productKeywords(name), ...attrPhrases, ...sectorEventKeywords(topSlugEarly, lower, seed)]) {
        const k = v.trim().toLowerCase();
        if (v && !seen.has(k)) { seen.add(k); out.push(v.trim()); }
      }
      return out;
    })();

    pages.push({
      path,
      title,
      description,
      h1: name,
      intro: productIntro,
      breadcrumb: crumb,
      sections,
      cta: { label: "Demander un devis gratuit", path: "/#devis" },
      faq: productFaq,
      internalLinks: [
        ...(related.length ? [{ heading: "Catégorie", links: related }] : []),
        ...(complementaryProducts.length ? [{ heading: "Produits complémentaires", links: complementaryProducts }] : []),
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
          // Real HT price of the DEFAULT configuration (from the configurator).
          // Undefined when the API can't resolve one → `offers` is simply omitted.
          fromPrice: priceMap.get(sku)?.price ?? null,
        }),
        ...(productFaq && productFaq.length ? [faqLd(productFaq)] : []),
      ],
      ogType: "product",
      keywords: productKw,
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

export async function buildThemePages(productLabels: Record<string, string> = {}): Promise<SeoPage[]> {
  const home: BreadcrumbItemLite = { name: "Accueil", path: "/" };

  const themes = (await rest<ThemeLite & { id: string }>(
    "product_themes?select=id,slug,name,description,sort_order&order=sort_order",
  )).filter((t) => t?.slug && t?.name);
  if (!themes.length) return [];

  // Real theme ↔ product mappings so each theme page links to existing,
  // sellable product pages (no orphan theme page).
  const themeMappings = await rest<{ sku: string; theme_id: string }>(
    "product_theme_mappings?select=sku,theme_id",
  );
  const skusByTheme = new Map<string, string[]>();
  for (const m of themeMappings) {
    if (!m?.sku || !m?.theme_id) continue;
    if (!productLabels[m.sku]) continue; // only sellable, prerendered products
    const list = skusByTheme.get(m.theme_id) || [];
    list.push(m.sku);
    skusByTheme.set(m.theme_id, list);
  }

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
    const themeSkus = (skusByTheme.get(t.id) || []).slice().sort();
    const themeProducts: LinkItem[] = themeSkus
      .slice(0, 24)
      .map((sku) => ({ label: productLabels[sku], path: `/products/${sku}` }));
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
      title: fitTitle(t.name, [
        `${t.name} – Thème impression personnalisée | J2L Print`,
        `Thème ${t.name} – Impression | J2L Print`,
        `${t.name} | J2L Print`,
      ], 60),

      description: desc,
      h1: t.name,
      intro: [
        `Découvrez la collection « ${t.name} » de J2L Print : une sélection de supports d'impression personnalisée à configurer en ligne et à recevoir partout en France.`,
      ],
      breadcrumb: crumb,
      cta: themeProducts.length
        ? { label: `Configurer ${themeProducts[0].label}`, path: themeProducts[0].path }
        : { label: "Voir tout le catalogue", path: "/catalogue" },
      faq,
      ...(themeProducts.length
        ? {
            productGrid: {
              heading: `Produits du thème « ${t.name} »`,
              intro: "Configurez votre produit en ligne : format, matière, finitions et quantité.",
              cards: themeProducts.map((l) => ({
                label: l.label,
                path: l.path,
                icon: "Package",
                description: `${l.label} personnalisable en ligne, livré partout en France.`,
              })),
            },
          }
        : {}),
      internalLinks: [
        ...(themeProducts.length ? [{ heading: "Produits associés", links: themeProducts }] : []),
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
