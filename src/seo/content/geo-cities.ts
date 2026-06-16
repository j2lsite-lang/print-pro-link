// Seed-based content generation for the 599 city pages and 101 department
// pages. Each page is genuinely differentiated — not a name-swap — because a
// deterministic seed (derived from the slug) selects an editorial ARCHETYPE
// (12 city profiles), then picks among large pools of intros, commercial
// blocks, product blocks, sector blocks, delivery blocks, CTA labels and FAQ
// formats. Pages also embed real data (postal codes, department, region, real
// neighbouring communes). Rich editorial profiles (priority cities/depts)
// enrich the copy further.
// IMPORTANT: J2L Print is an ONLINE printer — never claim a physical shop in
// any city, and never emit a LocalBusiness with a fake address.
import type { ContentSection, FaqItem } from "../types";
import { de, article } from "./fr";

// ── deterministic seed + pickers ────────────────────────────────────────────
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick<T>(arr: T[], seed: number, salt = 0): T {
  return arr[(seed + salt) % arr.length];
}
/** Rotate-pick `n` distinct items from a pool, varying subset+order by seed. */
function rotate<T>(pool: T[], seed: number, n: number, salt = 0): T[] {
  const out: T[] = [];
  const start = (seed + salt) % pool.length;
  for (let i = 0; i < Math.min(n, pool.length); i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

export interface NeighborRef { name: string; slug: string }

export interface GenCity {
  name: string;
  slug: string;
  cp: string;
  department: string;
  departmentSlug: string;
  region: string;
  regionSlug: string;
  neighbors: NeighborRef[];
  // optional editorial enrichment (priority cities)
  economy?: string;
  sectors?: string[];
  audiences?: string;
  events?: string;
}

// ── city archetypes ─────────────────────────────────────────────────────────
export type Archetype =
  | "metropole" | "prefecture" | "industrielle" | "touristique"
  | "commercante" | "artisanale" | "universitaire" | "logistique"
  | "rurale" | "evenementielle" | "frontaliere" | "littorale";

const ARCHETYPE_KEYS: Archetype[] = [
  "metropole", "prefecture", "industrielle", "touristique",
  "commercante", "artisanale", "universitaire", "logistique",
  "rurale", "evenementielle", "frontaliere", "littorale",
];

/** Deterministically classify a city: priority cities from their economy text,
 *  the rest from a stable seed bucket. Drives hero family + tailored copy. */
export function cityArchetype(c: GenCity): Archetype {
  const text = `${c.economy || ""} ${c.audiences || ""}`.toLowerCase();
  if (text.trim()) {
    if (/frontal|transfrontal|luxembourg|allemagne|fronti/.test(text)) return "frontaliere";
    if (/littoral|port|maritime|plage|côte|baln/.test(text)) return "littorale";
    if (/touris|vignoble|thermal|station|montagne|mémori|patrimoine/.test(text)) return "touristique";
    if (/industr|manufactur|métallurg|usine|sous-traitance/.test(text)) return "industrielle";
    if (/universit|étudiant|recherche/.test(text)) return "universitaire";
    if (/logist|entrep|plateforme/.test(text)) return "logistique";
    if (/artisan|métiers d'art|faïenc|cérami|créateur/.test(text)) return "artisanale";
    if (/événement|salon|congrès|festival|biennale|expo/.test(text)) return "evenementielle";
    if (/métropole|capitale|sièges|sièges? d'entreprise/.test(text)) return "metropole";
    if (/préfecture|chef-lieu|collectivit|administration/.test(text)) return "prefecture";
    if (/commerce|enseigne|boutique/.test(text)) return "commercante";
  }
  return ARCHETYPE_KEYS[seedOf(c.slug) % ARCHETYPE_KEYS.length];
}

interface ArchetypeProfile {
  /** dominant professional audiences (bullets for the "professionnels" H2) */
  sectors: string[];
  /** one sentence introducing those audiences */
  audience: string;
}

const ARCHETYPE_PROFILES: Record<Archetype, ArchetypeProfile> = {
  metropole: {
    sectors: ["Sièges d'entreprises, ETI et PME", "Professions libérales, cabinets et études", "Commerces et enseignes du centre-ville", "Agences, start-ups et prestataires de services", "Organisateurs de salons et congrès"],
    audience: "Entreprises, cabinets et organisateurs d'événements y commandent cartes de visite, brochures, stands roll-up et signalétique pour leurs rendez-vous professionnels.",
  },
  prefecture: {
    sectors: ["Collectivités, services publics et institutions", "Commerces et services du centre", "Associations et clubs sportifs", "Professions libérales et cabinets", "TPE et artisans locaux"],
    audience: "Collectivités, associations et commerces y commandent affiches, flyers, papeterie et signalétique pour leur communication courante et leurs manifestations.",
  },
  industrielle: {
    sectors: ["Industries, PME et sous-traitance", "Ateliers, logistique et maintenance", "Commerces et services aux entreprises", "Centres de formation et organismes techniques", "Associations et clubs d'entreprises"],
    audience: "Industriels et PME y commandent catalogues techniques, signalétique d'atelier, étiquettes et supports de prospection.",
  },
  touristique: {
    sectors: ["Hôtellerie, restauration et hébergeurs", "Offices de tourisme et sites de visite", "Commerces, boutiques et producteurs locaux", "Acteurs culturels et organisateurs d'événements", "Artisans et métiers de bouche"],
    audience: "Hôtels, sites touristiques et commerces y commandent dépliants, affiches, menus et étiquettes pour valoriser leur accueil et leurs produits.",
  },
  commercante: {
    sectors: ["Commerces et boutiques de proximité", "Enseignes, franchises et galeries", "Restaurants, cafés et métiers de bouche", "Artisans et TPE locales", "Associations de commerçants"],
    audience: "Commerçants et enseignes y commandent flyers, affiches, PLV et adhésifs de vitrine pour animer leurs ventes et leurs opérations.",
  },
  artisanale: {
    sectors: ["Artisans, ateliers et créateurs", "Métiers d'art et fabricants locaux", "Commerces et producteurs", "TPE et auto-entrepreneurs", "Associations et marchés de créateurs"],
    audience: "Artisans et créateurs y commandent étiquettes, cartons, emballages et objets personnalisés pour valoriser leur savoir-faire.",
  },
  universitaire: {
    sectors: ["Établissements d'enseignement et de formation", "Associations étudiantes et clubs", "Start-ups, incubateurs et laboratoires", "Commerces et restauration", "Organisateurs d'événements et de salons"],
    audience: "Écoles, associations étudiantes et start-ups y commandent affiches, flyers, textiles et supports événementiels.",
  },
  logistique: {
    sectors: ["Plateformes logistiques et transporteurs", "Industries et entrepôts", "Commerces de gros et distribution", "Services aux entreprises", "Collectivités et zones d'activité"],
    audience: "Sites logistiques et industriels y commandent signalétique, étiquettes, emballages et supports de sécurité.",
  },
  rurale: {
    sectors: ["Commerces et services de proximité", "Artisans, TPE et exploitations agricoles", "Associations et clubs de village", "Collectivités et écoles", "Producteurs et marchés locaux"],
    audience: "Commerçants, artisans et associations y commandent flyers, affiches, banderoles et étiquettes pour leurs activités et leurs manifestations.",
  },
  evenementielle: {
    sectors: ["Organisateurs d'événements et de salons", "Associations culturelles et sportives", "Collectivités et offices événementiels", "Commerces et sponsors locaux", "Agences de communication"],
    audience: "Organisateurs et associations y commandent banderoles, roll-up, PLV, kakémonos et affiches pour leurs manifestations.",
  },
  frontaliere: {
    sectors: ["Entreprises et services transfrontaliers", "Commerces et enseignes du centre", "PME, ateliers et industriels", "Professions libérales et frontaliers", "Associations et clubs sportifs"],
    audience: "Entreprises et commerces y commandent cartes de visite, brochures et signalétique, parfois bilingues, pour une clientèle locale et transfrontalière.",
  },
  littorale: {
    sectors: ["Hôtellerie, campings et hébergeurs", "Commerces, restaurants et plagistes", "Activités nautiques et de loisirs", "Offices de tourisme et événements", "Artisans et producteurs locaux"],
    audience: "Hébergeurs, commerces et acteurs du tourisme y commandent affiches, bâches, kakémonos et dépliants résistants pour la saison.",
  },
};

const SECTOR_POOL = [
  "Commerces et boutiques de proximité",
  "Artisans, TPE et auto-entrepreneurs",
  "Restaurants, cafés et métiers de bouche",
  "Associations, clubs sportifs et collectivités",
  "Professions libérales et cabinets",
  "PME, industries et sous-traitance",
  "Hôtellerie, tourisme et loisirs",
  "Agences, start-ups et prestataires de services",
];

// ── shared commercial pools ─────────────────────────────────────────────────
const WHY_ARGS = [
  "Un configurateur en ligne pour composer chaque support (format, matière, finitions, quantité).",
  "Un prix calculé en direct selon votre configuration, sans surprise.",
  "La vérification de vos fichiers avant impression (résolution, fonds perdus, CMJN).",
  "L'impression numérique et offset, selon le tirage et le rendu recherchés.",
  "Le grand format pour vos affiches, bâches, panneaux et PLV.",
  "Un devis personnalisé sous 24 h ouvrées lorsque votre projet le nécessite.",
  "La livraison partout en France, directement à votre adresse.",
  "Un interlocuteur professionnel pour vous accompagner sur vos projets.",
  "Une gamme complète centralisée : papeterie, signalétique, textile, objets et emballages.",
  "Aucun déplacement nécessaire : tout se commande et se suit en ligne.",
];

const CTA_LABELS = [
  "Voir le catalogue",
  "Configurer un produit",
  "Découvrir tous nos supports",
  "Composer ma commande en ligne",
  "Voir tous les produits",
  "Personnaliser un support",
];

export interface CityCopy {
  title: string;
  description: string;
  h1: string;
  heroEyebrow: string;
  heroTagline: string;
  intro: string[];
  sections: ContentSection[];
  faq: FaqItem[];
  productGridHeading: string;
  productGridIntro: string;
  ctaLabel: string;
}

export function cityCopy(c: GenCity): CityCopy {
  const s = seedOf(c.slug);
  const dep = article(c.department);
  const reg = article(c.region);
  const arch = cityArchetype(c);
  const ap = ARCHETYPE_PROFILES[arch];
  const econ =
    c.economy ||
    `${c.name} réunit un tissu dynamique de commerces, d'artisans et d'entreprises ${dep.de}.`;
  const audiences = c.audiences || ap.audience;
  const sectors = (c.sectors && c.sectors.length ? c.sectors : ap.sectors).slice(0, 6);
  const neigh = c.neighbors.slice(0, 6);
  const neighNames = neigh.map((n) => n.name);

  // ── title / h1 / description ──
  const title = pick(
    [
      `Imprimerie en ligne à ${c.name} — impression & supports publicitaires`,
      `Impression en ligne à ${c.name} (${c.cp}) | flyers, affiches, PLV`,
      `Imprimeur en ligne à ${c.name} — livraison rapide ${dep.dans}`,
      `Supports de communication imprimés à ${c.name}`,
    ],
    s,
    1,
  );
  const h1 = pick(
    [
      `Imprimerie en ligne pour les professionnels à ${c.name}`,
      `Impression et supports personnalisés à ${c.name}`,
      `Votre imprimeur en ligne à ${c.name}`,
      `Impression professionnelle livrée à ${c.name}`,
    ],
    s,
    2,
  );
  const description = pick(
    [
      `Impression professionnelle livrée à ${c.name} (${c.cp}) : flyers, cartes de visite, affiches, banderoles et PLV. Commande en ligne, livraison ${dep.dans}.`,
      `J2L Print, imprimeur en ligne livrant à ${c.name} : supports de communication, devis gratuit et livraison ${dep.dans} sans déplacement.`,
      `Commandez vos supports imprimés en ligne et faites-vous livrer à ${c.name} (${c.cp}) : impression, finitions et grand format livrés ${reg.dans}.`,
    ],
    s,
    3,
  );
  const heroEyebrow = pick(["Imprimerie en ligne", "Impression & PLV", "Supports de communication"], s, 4);
  const heroTagline = pick(
    [
      `Configurez vos supports en ligne et recevez votre devis personnalisé pour une livraison à ${c.name} et ${dep.dans}.`,
      `Du flyer au grand format : commandez à distance et faites-vous livrer à ${c.name} (${c.cp}), sans déplacement.`,
      `Une imprimerie en ligne complète au service des professionnels ${de(c.name)}, avec livraison ${reg.dans}.`,
    ],
    s,
    5,
  );

  // ── intro (8 angles, 2 paragraphs each) ──
  const introAngles: string[][] = [
    [
      `${econ} À ${c.name} (${c.cp}), J2L Print imprime et livre l'ensemble de vos supports de communication : vous configurez votre produit en ligne, validez votre fichier, puis recevez votre commande sans vous déplacer.`,
      `Imprimeur 100 % en ligne, J2L Print n'a pas de boutique à ${c.name} mais dessert toute la commune et ${dep.dans}, avec une livraison rapide ${reg.dans}. ${audiences}`,
    ],
    [
      `J2L Print accompagne les professionnels ${de(c.name)} avec une imprimerie en ligne complète : flyers, cartes de visite, affiches, banderoles, PLV et objets publicitaires, livrés directement à ${c.name} (${c.cp}).`,
      `${econ} Tout se commande à distance — configuration, devis et suivi en ligne — pour une livraison ${dep.dans} et plus largement ${reg.dans}.`,
    ],
    [
      `À ${c.name}, comme partout ${reg.dans}, J2L Print met l'impression professionnelle à portée de clic : choisissez votre format, vos finitions et votre quantité, et faites-vous livrer (${c.cp}) sans intermédiaire.`,
      `${econ} ${audiences} Aucun déplacement n'est nécessaire : J2L Print est un imprimeur en ligne livrant ${dep.dans}.`,
    ],
    [
      `Besoin d'impression personnalisée à ${c.name} ? J2L Print réunit toute votre communication visuelle en ligne, du tirage unitaire à la grande série, avec un prix calculé selon votre configuration.`,
      `${econ} Vos supports sont produits sur des presses professionnelles puis livrés à ${c.name} (${c.cp}) et ${dep.dans}, sans que vous ayez à vous déplacer.`,
    ],
    [
      `${audiences} Avec J2L Print, ces professionnels ${de(c.name)} commandent leur impression en ligne : cartes de visite, flyers, affiches, signalétique, textiles et objets publicitaires.`,
      `${econ} Imprimeur en ligne, J2L Print livre vos supports à ${c.name} (${c.cp}) et ${reg.dans}, avec contrôle du fichier avant production.`,
    ],
    [
      `J2L Print est l'imprimerie en ligne des entreprises, associations et collectivités ${de(c.name)}. Vous composez votre support, le prix s'affiche en direct, et votre commande est livrée à ${c.name} (${c.cp}).`,
      `${econ} De l'impression numérique à l'offset et au grand format, tout est centralisé en ligne et livré ${dep.dans}.`,
    ],
    [
      `Pour votre communication ${de(c.name)}, J2L Print imprime à la demande et livre sur place : flyers publicitaires, brochures, affiches, bâches, roll-up et goodies personnalisés.`,
      `${econ} ${audiences} Commande, devis et suivi se font 100 % en ligne, avec livraison à ${c.name} (${c.cp}) et ${reg.dans}.`,
    ],
    [
      `Impression professionnelle, prix transparents et livraison à ${c.name} : J2L Print accompagne votre communication visuelle sans déplacement, du fichier à la réception.`,
      `${econ} ${audiences} Vous commandez en ligne et recevez vos supports imprimés ${dep.dans}, dans le délai indiqué à la configuration.`,
    ],
  ];
  const intro = pick(introAngles, s, 6);

  // ── H2 "Des solutions pour les professionnels de {ville}" ──
  const proParas = [
    `${audiences} J2L Print adapte ses supports aux usages ${de(c.name)} :`,
    `Chaque secteur ${de(c.name)} a ses besoins d'impression. J2L Print y répond avec une gamme complète, configurable en ligne :`,
    `Que vous soyez commerçant, artisan, association ou collectivité, voici les profils ${de(c.name)} qui nous font confiance :`,
    `${audiences} Voici les principaux professionnels accompagnés à ${c.name} :`,
    `De la TPE à la grande organisation, J2L Print imprime pour tous les acteurs ${de(c.name)} :`,
    `À ${c.name}, nos supports servent aussi bien la prospection que l'événementiel ou la signalétique. Profils accompagnés :`,
  ];

  // ── H2 "Pourquoi choisir J2L Print ?" ──
  const whyArgs = rotate(WHY_ARGS, s, 6, 13);

  // ── livraison (6 first-paragraph variants) ──
  const livParas = [
    `Vos commandes sont imprimées puis expédiées et livrées à ${c.name} (${c.cp}) et dans l'ensemble ${dep.de}. Le délai dépend du produit et des finitions choisies, indiqués lors de la configuration.`,
    `Nous livrons vos supports imprimés directement à ${c.name} (${c.cp}), à votre adresse professionnelle ou personnelle, partout ${dep.dans}.`,
    `Une fois votre fichier validé, votre commande part en production puis vous est livrée à ${c.name} (${c.cp}) ${dep.dans}, sans déplacement.`,
    `La livraison couvre ${c.name} (${c.cp}) et tout le département : un forfait de livraison s'applique selon le support, et le délai est affiché avant validation.`,
    `Expédition rapide à ${c.name} (${c.cp}) et ${dep.dans} : le mode et le délai de livraison dépendent du produit et des finitions sélectionnées.`,
    `Vos supports sont livrés à ${c.name} (${c.cp}) et plus largement ${reg.dans}. Le délai varie selon le support et la finition, indiqué dès la configuration.`,
  ];
  const livraisonSecond = neighNames.length
    ? `Nous livrons aussi les communes voisines, comme ${neighNames.slice(0, 4).join(", ")}.`
    : c.events ||
      `Marchés, animations et événements locaux rythment l'année ${de(c.name)} et appellent affiches, banderoles et PLV.`;

  const sections: ContentSection[] = [
    {
      heading: `Des solutions pour les professionnels ${de(c.name)}`,
      paragraphs: [pick(proParas, s, 7)],
      bullets: sectors,
    },
    {
      heading: "Pourquoi choisir J2L Print ?",
      paragraphs: [`Une imprimerie en ligne complète pour ${c.name}, pensée pour les professionnels :`],
      bullets: whyArgs,
    },
    {
      heading: pick([`Livraison à ${c.name} et ${dep.dans}`, `Délais et livraison à ${c.name}`], s, 9),
      paragraphs: [pick(livParas, s, 8), livraisonSecond],
    },
  ];

  // ── FAQ (commercial pool of 9, rotate-pick 5) ──
  const faqPool: FaqItem[] = [
    {
      q: `Quels supports peut-on commander en ligne à ${c.name} ?`,
      a: `Flyers, cartes de visite, dépliants, brochures, affiches, panneaux, bâches, roll-up, étiquettes, adhésifs, textiles et objets publicitaires — tout se configure en ligne et se fait livrer à ${c.name} (${c.cp}).`,
    },
    {
      q: `Comment obtenir un devis d'impression à ${c.name} ?`,
      a: `Configurez votre produit pour voir le prix en direct, ou décrivez votre besoin dans le formulaire de devis : nous revenons vers vous avec une proposition personnalisée pour une livraison à ${c.name}.`,
    },
    {
      q: "Les fichiers sont-ils vérifiés avant production ?",
      a: "Oui. Chaque fichier (PDF de préférence, 300 dpi, CMJN, fonds perdus) fait l'objet d'un contrôle avant impression pour éviter les mauvaises surprises.",
    },
    {
      q: `Quels sont les délais de livraison à ${c.name} ?`,
      a: `Le délai dépend du produit et des finitions choisies ; il est affiché lors de la configuration, avant validation, pour une livraison à ${c.name} (${c.cp}) et ${dep.dans}.`,
    },
    {
      q: "Peut-on commander une petite quantité ?",
      a: "Oui, du tirage unitaire à la grande série. Les tarifs sont dégressifs selon la quantité, calculés en direct dans le configurateur.",
    },
    {
      q: `J2L Print possède-t-il une boutique à ${c.name} ?`,
      a: `Non. J2L Print est un imprimeur 100 % en ligne : configuration, validation du fichier, suivi et devis se font à distance, avec livraison à ${c.name}.`,
    },
    {
      q: "Quels produits conviennent à un salon professionnel ?",
      a: "Roll-up, kakémonos, totems, comptoirs et bâches, complétés par des cartes de visite, brochures et objets publicitaires : autant de supports configurables en ligne.",
    },
    {
      q: "Peut-on personnaliser une bâche, un roll-up ou un panneau ?",
      a: "Oui. Format, matière et finitions se choisissent en ligne pour les bâches, roll-up, panneaux rigides et adhésifs, avec un rendu fidèle à votre fichier.",
    },
    {
      q: `Livrez-vous aussi autour de ${c.name} ?`,
      a: `Oui, nous desservons ${dep.dans} et ${reg.dans}${neighNames.length ? `, notamment ${neighNames.slice(0, 3).join(", ")}` : ""}.`,
    },
  ];
  const faq = rotate(faqPool, s, 5, 11);

  // ── supports block ("Quels supports imprimer à {ville} ?") ──
  const productGridHeading = `Quels supports imprimer à ${c.name} ?`;
  const productGridIntro = pick(
    [
      `Du flyer à la bâche grand format, configurez vos supports en ligne et faites-vous livrer à ${c.name}. Cliquez sur une famille pour la personnaliser dans le catalogue.`,
      `Cartes de visite, affiches, roll-up ou textiles : retrouvez les supports les plus commandés ${de(c.name)} et personnalisez le vôtre en quelques clics.`,
      `Voici les familles de produits les plus utiles aux professionnels ${de(c.name)}. Chaque support se configure en ligne avec ses formats et finitions.`,
      `Communication courante, événement ou opération commerciale à ${c.name} : choisissez le support adapté et lancez votre commande en ligne.`,
      `Une gamme complète pour ${c.name}, de la papeterie d'entreprise au grand format. Sélectionnez une catégorie pour découvrir les options.`,
      `Pour vos campagnes ${de(c.name)}, sélectionnez vos supports imprimés parmi nos familles phares et personnalisez-les en ligne.`,
      `Tous vos supports de communication réunis pour ${c.name} : papier, signalétique, adhésifs, textiles et objets publicitaires.`,
      `Découvrez les supports plébiscités par les entreprises ${de(c.name)} et configurez votre commande, livrée sur place.`,
    ],
    s,
    14,
  );
  const ctaLabel = pick(CTA_LABELS, s, 15);

  return {
    title,
    description,
    h1,
    heroEyebrow,
    heroTagline,
    intro,
    sections,
    faq,
    productGridHeading,
    productGridIntro,
    ctaLabel,
  };
}

// ── department copy ─────────────────────────────────────────────────────────
export interface GenDept {
  name: string;
  slug: string;
  code: string;
  region: string;
  regionSlug: string;
  cityNames: string[];
  economy?: string;
  sectors?: string[];
}

export interface DeptCopy {
  title: string;
  description: string;
  h1: string;
  heroEyebrow: string;
  heroTagline: string;
  intro: string[];
  sections: ContentSection[];
  faq: FaqItem[];
  productGridHeading: string;
  productGridIntro: string;
  ctaLabel: string;
}

export function deptCopy(d: GenDept): DeptCopy {
  const s = seedOf(d.slug);
  const art = article(d.name);
  const reg = article(d.region);
  const econ =
    d.economy ||
    `Le département ${d.name} (${d.code}) réunit un tissu varié de commerces, d'artisans, de PME et de collectivités, ${reg.dans}.`;
  const sectors = (d.sectors && d.sectors.length ? d.sectors : rotate(SECTOR_POOL, s, 5, 2)).slice(0, 5);

  const title = pick(
    [
      `Impression en ligne ${art.dans} (${d.region})`,
      `Imprimeur en ligne ${art.dans} | supports & PLV`,
      `Impression et supports personnalisés ${art.dans}`,
    ],
    s,
    1,
  );
  const h1 = pick(
    [
      `Impression professionnelle et supports personnalisés ${art.dans}`,
      `Votre imprimeur en ligne ${art.dans}`,
      `Impression en ligne livrée ${art.dans}`,
    ],
    s,
    2,
  );
  const description = pick(
    [
      `Imprimerie en ligne livrant ${art.dans} : supports professionnels, prix transparents, commande à distance et livraison locale.`,
      `J2L Print imprime et livre ${art.dans} (${d.region}) : flyers, affiches, bâches, PLV et objets publicitaires, sans déplacement.`,
    ],
    s,
    3,
  );
  const heroEyebrow = `Imprimerie en ligne · ${d.region}`;
  const heroTagline = pick(
    [
      `Commandez vos supports en ligne et faites-vous livrer ${art.dans}, des grandes villes aux communes rurales.`,
      `Une imprimerie en ligne complète pour les professionnels ${art.de}, avec livraison ${reg.dans}.`,
    ],
    s,
    4,
  );

  const intro = [
    `${econ} J2L Print accompagne les professionnels ${art.de} avec une imprimerie en ligne complète : vous commandez à distance et nous livrons sur place.`,
    `Aucune boutique physique n'est nécessaire : la configuration, la validation du fichier et la livraison se font en ligne ${art.dans}.`,
  ];

  const sections: ContentSection[] = [
    {
      heading: `Impression professionnelle ${art.dans}`,
      paragraphs: [
        `${econ} Pour répondre à ces besoins, J2L Print réunit en ligne toute la chaîne d'impression : papeterie, signalétique, grand format, adhésifs, textiles et objets publicitaires.`,
      ],
    },
    {
      heading: `Supports recommandés pour les entreprises ${art.de}`,
      paragraphs: ["Nos supports s'adaptent aux principaux secteurs du département :"],
      bullets: sectors,
    },
    {
      heading: "Signalétique, papeterie et communication événementielle",
      paragraphs: [
        `Du salon professionnel à l'inauguration, en passant par la communication courante, J2L Print imprime affiches, roll-up, kakémonos, banderoles, cartes de visite et brochures, livrés ${art.dans}.`,
      ],
    },
  ];
  if (d.cityNames.length) {
    sections.push({
      heading: `Livraison dans les principales villes ${art.de}`,
      paragraphs: ["Nous livrons l'ensemble du département, notamment :"],
      bullets: d.cityNames.slice(0, 30),
    });
  }
  sections.push({
    heading: "Pourquoi choisir J2L Print ?",
    paragraphs: [`Une imprimerie en ligne complète au service des professionnels ${art.de} :`],
    bullets: rotate(WHY_ARGS, s, 6, 13),
  });

  const faqPool: FaqItem[] = [
    {
      q: `Livrez-vous partout ${art.dans} ?`,
      a: `Oui. J2L Print livre l'ensemble du département ${d.name}, des grandes villes aux communes rurales, directement à votre adresse.`,
    },
    {
      q: "Faut-il se déplacer pour commander ?",
      a: `Non. Tout se fait en ligne : configuration, validation du fichier et suivi. J2L Print n'a pas d'imprimerie physique ${art.dans}.`,
    },
    {
      q: "Quels professionnels accompagnez-vous ?",
      a: `${sectors.slice(0, 4).join(", ")} et toutes les organisations ${art.de}.`,
    },
    {
      q: "Comment obtenir un devis ?",
      a: "Configurez votre produit pour un prix immédiat, ou décrivez votre besoin dans le formulaire de devis : nous vous répondons avec une proposition personnalisée.",
    },
    {
      q: `Quels délais de livraison ${art.dans} ?`,
      a: "Le délai dépend du produit et des finitions choisies ; il est indiqué lors de la configuration en ligne.",
    },
    {
      q: "Peut-on imprimer du grand format et de la PLV ?",
      a: "Oui : affiches, bâches, panneaux rigides, roll-up, kakémonos et totems se configurent en ligne, avec un rendu fidèle à votre fichier.",
    },
  ];
  const faq = rotate(faqPool, s, 5, 5);

  return {
    title,
    description,
    h1,
    heroEyebrow,
    heroTagline,
    intro,
    sections,
    faq,
    productGridHeading: `Supports les plus demandés ${art.dans}`,
    productGridIntro: `Les supports les plus utiles aux professionnels ${art.de}. Configurez le vôtre dans le catalogue.`,
    ctaLabel: pick(CTA_LABELS, s, 15),
  };
}
