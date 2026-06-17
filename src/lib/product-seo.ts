/**
 * Produces factual, family-accurate AND keyword-rich product copy for fiche
 * produit pages, driven by the semantic map (src/seo/data/semantic-keywords.ts).
 *
 * Rules enforced here (supplier audit):
 *  - Each product gets copy matching ITS real family — never a neighbour's.
 *  - Hard guardrails prevent cross-contamination
 *    (bottle ≠ mug, poster ≠ flyer, bag ≠ brochure, textile ≠ papeterie).
 *  - Content is seeded by SKU so two products of the same family stay distinct
 *    (anti-duplication) — no shared placeholder block.
 *  - When no reliable family is detected we return SHORT, factual fallback
 *    copy built from the product name — never a long generic marketing block.
 *  - Never invents prices, stock, reviews, ratings or delivery promises.
 */

import { normalize } from "./search";
import {
  FAMILY_KEYWORDS, SECTORS_POOL, seedFrom, pickN, pickOne, type SemanticEntry,
} from "@/seo/data/semantic-keywords";

export interface ProductSEOData {
  /* ── stable fields (consumed by the prerenderer + runtime) ── */
  intro: string;
  useCases: string;
  quality: string;
  faq: { q: string; a: string }[];
  /* ── semantic / visible-block fields (optional, masked when empty) ── */
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  longTail?: string[];
  whyChoose?: string[];
  usagesList?: string[];
  sectors?: string[];
  materials?: string[];
  formats?: string[];
  finitions?: string[];
  fileTips?: string[];
  /** complementary universes (category slugs → safe internal links) */
  complementary?: string[];
}

/**
 * Ordered family detectors. The FIRST family whose token appears in the
 * product name/SKU AND whose `forbid` tokens are absent wins. The order +
 * guardrails guarantee no cross-contamination between families.
 */
const FAMILY_DETECTORS: { key: keyof typeof FAMILY_KEYWORDS; tokens: string[]; forbid?: string[] }[] = [
  { key: "bottle", tokens: ["bottle", "bouteille", "gourde", "drinkware", "drinking"] },
  { key: "mug", tokens: ["mug", "tasse", "gobelet"], forbid: ["bottle", "bouteille", "gourde", "drinking"] },
  { key: "t-shirt", tokens: ["t shirt", "tshirt", "tee shirt", "textile", "polo", "sweat", "hoodie", "vetement", "veste", "softshell"] },
  { key: "bag", tokens: ["bag", "sac", "sachet", "tote", "pochette", "emballage"] },
  { key: "menu", tokens: ["menu", "set de table", "carte restaurant", "carte des vins", "napperon", "sous main"], forbid: ["carte de visite", "business"] },
  { key: "affiche", tokens: ["affiche", "poster"], forbid: ["flyer", "prospectus", "tract"] },
  { key: "brochure", tokens: ["brochure", "depliant", "plaquette", "catalogue", "leaflet", "booklet"], forbid: ["flyer", "affiche", "poster"] },
  { key: "flyer", tokens: ["flyer", "prospectus", "tract"], forbid: ["poster", "affiche", "bag", "sac", "brochure", "depliant"] },
  { key: "carte", tokens: ["carte de visite", "business card", "businesscard", "visite"] },
  { key: "roll-up", tokens: ["roll up", "rollup", "kakemono", "enrouleur", "totem"] },
  { key: "banner", tokens: ["banner", "banderole", "bache", "drapeau", "oriflamme", "pavillon"] },
  { key: "adhesif", tokens: ["adhesif", "sticker", "autocollant", "vinyle", "vitrophanie", "etiquette", "label"] },
  { key: "panneau", tokens: ["panneau", "plaque", "signaletique", "enseigne", "dibond", "forex", "akylux", "plv"] },
];

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const low = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Join a short list into a natural French enumeration. */
function naturalList(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

/** Standard, factual file-preparation tips (seeded subset). */
const FILE_TIPS_POOL = [
  "Exportez un fichier PDF haute résolution (300 dpi).",
  "Travaillez en mode colorimétrique CMJN pour des couleurs fidèles.",
  "Prévoyez 3 mm de fonds perdus tout autour du document.",
  "Vectorisez vos textes ou intégrez les polices utilisées.",
  "Fournissez un logo vectoriel (PDF/AI/EPS) pour un marquage net.",
  "Conservez une zone de sécurité pour les éléments importants.",
];

/** Build a seeded, family-accurate intro that always names the product. */
function buildIntro(name: string, fam: SemanticEntry, seed: number): string {
  const usage = low(pickOne(fam.usages, seed));
  const sector = naturalList(pickN(fam.sectors, seed + 1, 3));
  const finition = pickOne(fam.finitions, seed + 2);
  const frames: string[] = [
    `${cap(name)} : ${fam.primaryKeyword} à configurer en ligne chez J2L Print. Idéal pour ${usage}, ce support se commande sur mesure et se livre partout en France.`,
    `Optez pour ${fam.primaryKeyword} avec ${low(name)} : un support adapté à ${sector}. Choisissez vos options en ligne et obtenez un prix immédiat.`,
    `${cap(name)} fait partie de notre offre de ${fam.primaryKeyword}. Pensé pour ${usage}, il se personnalise (format, ${finition}, quantité) directement en ligne.`,
    `Besoin de ${fam.primaryKeyword.toLowerCase()} ? ${cap(name)} se configure en ligne et s'adresse à ${sector}, avec une fabrication soignée et un devis gratuit.`,
  ];
  return pickOne(frames, seed);
}

/** Build seeded "usages" prose from the family usages. */
function buildUseCases(name: string, fam: SemanticEntry, seed: number): string {
  const u = pickN(fam.usages, seed, 3).map(low);
  const sector = naturalList(pickN(fam.sectors, seed + 3, 3));
  return `Utilisez ${low(name)} pour ${naturalList(u)}. Ce support s'adresse particulièrement à ${sector}. Sélectionnez vos options ci-dessus pour l'adapter à votre projet ou demandez un devis personnalisé.`;
}

/** Build seeded quality/finition prose from real materials + finitions. */
function buildQuality(fam: SemanticEntry, seed: number): string {
  const mat = naturalList(pickN(fam.materials, seed, 3));
  const fin = naturalList(pickN(fam.finitions, seed + 1, 3));
  return `Fabrication professionnelle sur ${mat}, avec un choix de finitions : ${fin}. Vos fichiers PDF sont vérifiés avant impression et chaque commande est contrôlée avant expédition, partout en France métropolitaine.`;
}

/** "Pourquoi choisir" benefit bullets (seeded, family-aware). */
function buildWhyChoose(fam: SemanticEntry, seed: number): string[] {
  const base = [
    "Configuration en ligne et prix immédiat",
    `${cap(fam.primaryKeyword)} sur mesure`,
    "Vérification de vos fichiers avant impression",
    "Devis gratuit et livraison partout en France",
  ];
  const extra = `Finitions au choix : ${naturalList(pickN(fam.finitions, seed, 2))}`;
  return [...base.slice(0, 3), extra, base[3]];
}

/** Short, factual fallback copy built from the product name (no marketing block). */
function buildGenericData(productName: string): ProductSEOData {
  const name = productName.trim() || "ce produit";
  const lower = name.toLowerCase();
  const seed = seedFrom(name);
  return {
    intro:
      `${name} fait partie du catalogue d'impression et de communication J2L Print. ` +
      `Configurez votre produit (format, quantité, options) directement en ligne et obtenez un prix immédiat.`,
    useCases:
      `Utilisez ${lower} pour vos besoins de communication professionnelle. ` +
      `Sélectionnez vos options ci-dessus pour adapter le produit à votre projet, ou demandez un devis personnalisé.`,
    quality:
      "Impression et finition professionnelles, contrôle qualité avant expédition et vérification de vos fichiers PDF. " +
      "Livraison en France métropolitaine sous 3 à 5 jours ouvrés.",
    faq: [
      { q: "Quels fichiers fournir pour l'impression ?", a: "Un fichier PDF haute résolution (300 dpi), en CMJN, avec les fonds perdus requis. Notre équipe vérifie votre fichier avant impression." },
      { q: "Comment obtenir un prix ?", a: "Configurez vos options ci-dessus : le prix se calcule automatiquement. Vous pouvez aussi demander un devis personnalisé." },
      { q: "Peut-on commander une petite quantité ?", a: "Oui, la quantité est modulable, avec un tarif dégressif sur les volumes plus importants." },
    ],
    primaryKeyword: `${lower} personnalisé`,
    secondaryKeywords: [
      "impression personnalisée", "impression en ligne", `${lower} sur mesure`,
      "avec logo", "devis gratuit", "petite quantité", "grande quantité",
    ],
    longTail: [
      `imprimer ${lower} en ligne`,
      `${lower} personnalisé sur mesure`,
      `${lower} avec logo`,
    ],
    whyChoose: [
      "Configuration en ligne et prix immédiat",
      "Fabrication professionnelle sur mesure",
      "Vérification de vos fichiers avant impression",
      "Devis gratuit et livraison partout en France",
    ],
    usagesList: ["Communication professionnelle", "Événements et opérations commerciales", "Image de marque"],
    sectors: pickN(SECTORS_POOL, seed, 5),
    fileTips: pickN(FILE_TIPS_POOL, seed, 3),
    complementary: ["impression-papier", "objets-publicitaires-cadeaux"],
  };
}

/** Resolve the matching family key for a product (with guardrails). */
export function detectFamily(productName: string, sku?: string): keyof typeof FAMILY_KEYWORDS | null {
  const search = normalize(`${productName} ${sku || ""}`);
  for (const detector of FAMILY_DETECTORS) {
    const hasToken = detector.tokens.some((t) => search.includes(normalize(t)));
    if (!hasToken) continue;
    const forbidden = detector.forbid?.some((t) => search.includes(normalize(t)));
    if (forbidden) continue;
    return detector.key;
  }
  return null;
}

/**
 * Find the best matching SEO data for a given product, with hard guardrails to
 * avoid using a neighbouring product's family copy. Seeded by SKU so products
 * of the same family get distinct copy (anti-duplication).
 */
export function getProductSEOData(productName: string, sku?: string): ProductSEOData {
  const key = detectFamily(productName, sku);
  if (!key) return buildGenericData(productName);

  const fam = FAMILY_KEYWORDS[key];
  const name = productName.trim() || fam.primaryKeyword;
  const seed = seedFrom(sku || name);

  return {
    intro: buildIntro(name, fam, seed),
    useCases: buildUseCases(name, fam, seed),
    quality: buildQuality(fam, seed),
    faq: pickN(fam.faq, seed, 5),
    primaryKeyword: fam.primaryKeyword,
    secondaryKeywords: pickN(fam.secondary, seed, 9),
    longTail: pickN(fam.longTail, seed, 3),
    whyChoose: buildWhyChoose(fam, seed),
    usagesList: pickN(fam.usages, seed, 4),
    sectors: pickN(fam.sectors, seed, 5),
    materials: fam.materials.slice(),
    formats: fam.formats.slice(),
    finitions: fam.finitions.slice(),
    fileTips: pickN(FILE_TIPS_POOL, seed, 4),
    complementary: fam.complementary.slice(),
  };
}
