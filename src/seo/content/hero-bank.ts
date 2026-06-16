// Bank of 16 distinct hero visuals for the local SEO pages (cities /
// departments / regions). Each image is a locally-hosted asset under
// public/seo/ (never a remote runtime URL), kept at 1280x720 with object-fit
// cover + dark overlay handled by the renderer. Assignment is deterministic
// (seed + archetype + neighbour avoidance) so a same image never lands on all
// pages and two neighbouring cities rarely share the exact same hero.

export interface HeroImage {
  file: string;
  family: string;
  /** generic alt fallback; pages override with a location-specific alt */
  alt: string;
}

export const HERO_BANK: HeroImage[] = [
  { file: "/seo/hero-cartes-visite.jpg", family: "papeterie", alt: "Cartes de visite et papeterie d'entreprise imprimées" },
  { file: "/seo/hero-flyers.jpg", family: "flyers", alt: "Flyers et dépliants publicitaires imprimés" },
  { file: "/seo/hero-brochures.jpg", family: "brochures", alt: "Brochures et catalogues imprimés" },
  { file: "/seo/hero-affiches.jpg", family: "affiches", alt: "Affiches et posters grand format" },
  { file: "/seo/hero-panneaux.jpg", family: "signaletique", alt: "Panneaux et signalétique professionnelle" },
  { file: "/seo/hero-baches.jpg", family: "grandformat", alt: "Bâches et banderoles grand format" },
  { file: "/seo/hero-autocollants.jpg", family: "stickers", alt: "Autocollants, stickers et étiquettes personnalisés" },
  { file: "/seo/hero-rollup.jpg", family: "plv", alt: "Roll-up et PLV pour salons et points de vente" },
  { file: "/seo/hero-emballages.jpg", family: "emballages", alt: "Emballages et sacs personnalisés" },
  { file: "/seo/hero-objets.jpg", family: "objets", alt: "Objets publicitaires et goodies personnalisés" },
  { file: "/seo/hero-textiles.jpg", family: "textiles", alt: "Textiles personnalisés et vêtements floqués" },
  { file: "/seo/hero-atelier.jpg", family: "atelier", alt: "Atelier d'impression numérique et grand format" },
  { file: "/seo/hero-preparation.jpg", family: "preparation", alt: "Préparation et conditionnement des commandes imprimées" },
  { file: "/seo/hero-livraison.jpg", family: "livraison", alt: "Livraison professionnelle des supports imprimés" },
  { file: "/seo/hero-commerce.jpg", family: "commerce", alt: "Commerce local et vitrine habillée de supports imprimés" },
  { file: "/seo/hero-evenementiel.jpg", family: "evenementiel", alt: "Événementiel et stands habillés de supports imprimés" },
];

const FAMILY_INDEX: Record<string, number> = HERO_BANK.reduce((m, h, i) => {
  m[h.family] = i;
  return m;
}, {} as Record<string, number>);

/** Hero families preferred by each city archetype (deterministic choice). */
export const ARCHETYPE_HERO_FAMILIES: Record<string, string[]> = {
  metropole: ["brochures", "affiches", "plv", "atelier"],
  prefecture: ["papeterie", "brochures", "signaletique", "commerce"],
  industrielle: ["atelier", "signaletique", "preparation", "emballages"],
  touristique: ["affiches", "flyers", "stickers", "commerce"],
  commercante: ["commerce", "flyers", "stickers", "plv"],
  artisanale: ["stickers", "emballages", "objets", "atelier"],
  universitaire: ["flyers", "affiches", "textiles", "evenementiel"],
  logistique: ["preparation", "livraison", "emballages", "signaletique"],
  rurale: ["flyers", "commerce", "livraison", "papeterie"],
  evenementielle: ["evenementiel", "plv", "grandformat", "affiches"],
  frontaliere: ["signaletique", "brochures", "objets", "livraison"],
  littorale: ["grandformat", "affiches", "textiles", "evenementiel"],
};

const DEPT_HERO_FAMILIES = ["atelier", "signaletique", "brochures", "livraison", "grandformat", "commerce", "preparation", "emballages"];
const REGION_HERO_FAMILIES = ["atelier", "affiches", "brochures", "grandformat", "plv", "livraison", "commerce", "evenementiel"];

function idxOfFamily(family: string): number {
  return FAMILY_INDEX[family] ?? 0;
}

/** Base hero index for a city, from its archetype + seed. */
export function cityHeroIndex(archetype: string, seed: number): number {
  const fams = ARCHETYPE_HERO_FAMILIES[archetype] || ARCHETYPE_HERO_FAMILIES.commercante;
  return idxOfFamily(fams[seed % fams.length]);
}

export function deptHeroIndex(seed: number): number {
  return idxOfFamily(DEPT_HERO_FAMILIES[seed % DEPT_HERO_FAMILIES.length]);
}

export function regionHeroIndex(seed: number): number {
  return idxOfFamily(REGION_HERO_FAMILIES[seed % REGION_HERO_FAMILIES.length]);
}

export function heroAt(index: number): HeroImage {
  return HERO_BANK[((index % HERO_BANK.length) + HERO_BANK.length) % HERO_BANK.length];
}
