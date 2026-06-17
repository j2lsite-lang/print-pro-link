// Google-query builders for the existing SEO pages.
// PURE DATA: never touches URLs, prices, SKUs, the configurator, the cart,
// quotes, uploads, emails or the database. It only PREPARES the natural
// search expressions ("requêtes Google") attached to each prerendered page
// as a crawler-readable, visually-hidden "Recherches fréquentes" list.
//
// The lists mirror the supplier brief: a primary query, secondary variants,
// natural variants (with / without "à"), commercial intents (devis, prix,
// tarif, commander…) and long-tail queries. Deduplicated, order-stable.

import type { SemanticEntry } from "../../src/seo/data/semantic-keywords";
import { pickN } from "../../src/seo/data/semantic-keywords";

/** Deduplicate while preserving order; drop empties. */
function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = (raw || "").replace(/\s+/g, " ").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* General site queries (homepage / catalogue)                                */
/* -------------------------------------------------------------------------- */
export const SITE_KEYWORDS: string[] = uniq([
  "imprimerie en ligne",
  "imprimeur en ligne",
  "imprimerie professionnelle",
  "impression professionnelle",
  "imprimerie pour entreprises",
  "imprimeur pour professionnels",
  "impression personnalisée",
  "produits imprimés personnalisés",
  "supports publicitaires personnalisés",
  "devis imprimerie en ligne",
  "tarif impression professionnelle",
  "imprimerie avec livraison en France",
  "impression publicitaire pour entreprise",
  "commander des supports imprimés",
  "catalogue imprimerie en ligne",
]);

/* -------------------------------------------------------------------------- */
/* City queries — "à {Ville}" + natural variants + commercial + long-tail     */
/* -------------------------------------------------------------------------- */
export function cityKeywords(name: string): string[] {
  const V = name;
  return uniq([
    // Core local intent
    `imprimerie à ${V}`,
    `imprimeur à ${V}`,
    `imprimeur ${V}`,
    `imprimerie professionnelle à ${V}`,
    `impression professionnelle à ${V}`,
    `imprimerie en ligne à ${V}`,
    `devis imprimerie à ${V}`,
    `tarif imprimerie à ${V}`,
    `impression personnalisée à ${V}`,
    `impression publicitaire à ${V}`,
    `imprimeur pour entreprise à ${V}`,
    `produits imprimés personnalisés à ${V}`,
    `supports publicitaires à ${V}`,
    `supports de communication à ${V}`,
    `livraison de produits imprimés à ${V}`,
    // Products
    `cartes de visite personnalisées à ${V}`,
    `impression cartes de visite à ${V}`,
    `flyers personnalisés à ${V}`,
    `impression flyers à ${V}`,
    `prospectus personnalisés à ${V}`,
    `dépliants personnalisés à ${V}`,
    `impression dépliants à ${V}`,
    `brochures personnalisées à ${V}`,
    `impression brochures à ${V}`,
    `catalogues personnalisés à ${V}`,
    `impression catalogues à ${V}`,
    `affiches personnalisées à ${V}`,
    `impression affiches à ${V}`,
    `affiches publicitaires à ${V}`,
    `autocollants personnalisés à ${V}`,
    `impression autocollants à ${V}`,
    `stickers personnalisés à ${V}`,
    `étiquettes personnalisées à ${V}`,
    `impression étiquettes à ${V}`,
    `panneaux publicitaires à ${V}`,
    `panneaux personnalisés à ${V}`,
    `panneaux de chantier à ${V}`,
    `panneaux immobiliers à ${V}`,
    `signalétique personnalisée à ${V}`,
    `signalétique entreprise à ${V}`,
    `enseigne personnalisée à ${V}`,
    `bâche publicitaire à ${V}`,
    `banderole personnalisée à ${V}`,
    `roll-up personnalisé à ${V}`,
    `kakémono personnalisé à ${V}`,
    `PLV personnalisée à ${V}`,
    `stand publicitaire à ${V}`,
    `beach flag personnalisé à ${V}`,
    `packaging personnalisé à ${V}`,
    `emballage personnalisé à ${V}`,
    `boîtes personnalisées à ${V}`,
    `objets publicitaires à ${V}`,
    `goodies personnalisés à ${V}`,
    `cadeaux d'entreprise personnalisés à ${V}`,
    `textile personnalisé à ${V}`,
    `vêtements personnalisés à ${V}`,
    `calendriers personnalisés à ${V}`,
    `agendas personnalisés à ${V}`,
    // Natural variants without "à"
    `imprimerie ${V}`,
    `impression flyers ${V}`,
    `cartes de visite personnalisées ${V}`,
    `panneaux publicitaires ${V}`,
    `roll-up personnalisé ${V}`,
    `objets publicitaires ${V}`,
    // Commercial
    `devis flyers personnalisés ${V}`,
    `prix cartes de visite ${V}`,
    `tarif impression brochures ${V}`,
    `objets publicitaires avec logo ${V}`,
    `imprimeur professionnel ${V}`,
    `imprimeur avec livraison ${V}`,
    // Long-tail
    `où faire imprimer des flyers à ${V}`,
    `quel imprimeur choisir à ${V}`,
    `où commander des cartes de visite à ${V}`,
    `faire imprimer des brochures à ${V}`,
    `commander un roll-up pour un salon à ${V}`,
    `faire imprimer des autocollants avec logo à ${V}`,
    `demander un devis imprimerie à ${V}`,
  ]);
}

/* -------------------------------------------------------------------------- */
/* Department / Region queries                                                */
/* `dans` = the grammatical article form ("dans les Vosges", "en Moselle",    */
/* "dans le Grand Est"); `name` = the bare administrative name.               */
/* -------------------------------------------------------------------------- */
function zoneKeywords(name: string, dans: string): string[] {
  return uniq([
    `imprimerie ${dans}`,
    `imprimeur ${dans}`,
    `imprimerie professionnelle ${dans}`,
    `impression professionnelle ${dans}`,
    `devis imprimerie ${name}`,
    `tarif imprimerie ${name}`,
    `impression personnalisée ${dans}`,
    `impression publicitaire ${dans}`,
    `imprimeur pour entreprise ${dans}`,
    `cartes de visite personnalisées ${dans}`,
    `impression flyers ${dans}`,
    `flyers personnalisés ${dans}`,
    `brochures personnalisées ${dans}`,
    `affiches publicitaires ${dans}`,
    `autocollants personnalisés ${dans}`,
    `étiquettes personnalisées ${dans}`,
    `panneaux publicitaires ${dans}`,
    `signalétique personnalisée ${dans}`,
    `bâches publicitaires ${dans}`,
    `roll-up personnalisé ${dans}`,
    `PLV personnalisée ${dans}`,
    `packaging personnalisé ${dans}`,
    `objets publicitaires ${dans}`,
    `goodies personnalisés ${dans}`,
    `textile personnalisé ${dans}`,
    `calendriers personnalisés ${dans}`,
    // Commercial + long-tail
    `fournisseur panneaux publicitaires ${name}`,
    `imprimeur professionnel ${name}`,
    `impression petite quantité ${name}`,
    `trouver un imprimeur professionnel ${dans}`,
    `où faire imprimer des flyers ${dans}`,
    `imprimer des supports publicitaires pour une entreprise ${dans}`,
  ]);
}

export const deptKeywords = zoneKeywords;
export function regionKeywords(name: string, dans: string): string[] {
  return uniq([
    ...zoneKeywords(name, dans),
    `impression pour entreprises ${dans}`,
    `imprimerie avec livraison ${dans}`,
  ]);
}

/* -------------------------------------------------------------------------- */
/* Category queries — derived from the semantic universe (no stuffing)         */
/* -------------------------------------------------------------------------- */
export function categoryKeywords(entry: SemanticEntry): string[] {
  const p = entry.primaryKeyword;
  return uniq([
    p,
    ...entry.secondary,
    ...entry.synonyms,
    ...entry.longTail,
    `devis ${p}`,
    `prix ${p}`,
    `tarif ${p}`,
    `commander ${p}`,
  ]).slice(0, 40);
}

/** Subcategory: a seeded, page-specific subset so twin subcats stay distinct. */
export function subcategoryKeywords(entry: SemanticEntry, name: string, seed: number): string[] {
  const lower = name.toLowerCase();
  return uniq([
    entry.primaryKeyword,
    `${name} personnalisé`,
    `impression ${lower}`,
    ...pickN(entry.secondary, seed, Math.min(8, entry.secondary.length)),
    ...pickN(entry.longTail, seed + 1, Math.min(4, entry.longTail.length)),
    `devis ${entry.primaryKeyword}`,
    `prix ${lower}`,
  ]);
}

/* -------------------------------------------------------------------------- */
/* Product queries — name-based natural + commercial expressions               */
/* -------------------------------------------------------------------------- */
export function productKeywords(name: string): string[] {
  const lower = name.toLowerCase();
  return uniq([
    `${name} personnalisé`,
    `impression ${lower}`,
    `${lower} sur mesure`,
    `${lower} avec logo`,
    `${lower} professionnel`,
    `devis ${lower}`,
    `prix ${lower}`,
    `tarif ${lower}`,
    `commander ${lower}`,
    `${lower} pas cher`,
  ]);
}
