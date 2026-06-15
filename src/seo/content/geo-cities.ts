// Seed-based content generation for the 599 city pages and 101 department
// pages. Each page is genuinely differentiated — not a name-swap — because a
// deterministic seed (derived from the slug) selects among several sentence
// templates, rotates the sector subset/order, varies the FAQ subset, and the
// pages embed real data (postal codes, department, region, real neighbouring
// communes). When a rich editorial profile exists (priority cities/depts), it
// enriches the copy further.
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

const SECTOR_POOL = [
  "Commerces et boutiques de proximité",
  "Artisans, TPE et auto-entrepreneurs",
  "Restaurants, cafés et métiers de bouche",
  "Associations, clubs sportifs et collectivités",
  "Professions libérales et cabinets",
  "PME, industries et sous-traitance",
  "Hôtellerie, tourisme et loisirs",
  "Agences, start-ups et prestataires de services",
  "Santé, bien-être et professions médicales",
  "Immobilier, BTP et aménagement",
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
}

export function cityCopy(c: GenCity): CityCopy {
  const s = seedOf(c.slug);
  const dep = article(c.department);
  const reg = article(c.region);
  const econ =
    c.economy ||
    `${c.name} réunit un tissu dynamique de commerces, d'artisans et d'entreprises ${dep.de}.`;
  const audiences =
    c.audiences ||
    `Commerçants, artisans, associations et collectivités ${de(c.name)} commandent leurs supports en ligne et sont livrés sur place.`;
  const sectors = (c.sectors && c.sectors.length ? c.sectors : rotate(SECTOR_POOL, s, 5, 3)).slice(0, 5);
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

  // ── intro (2 paragraphs, 3 angles) ──
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
  ];
  const intro = pick(introAngles, s, 6);

  // ── sections ──
  const solutionsHeading = pick(
    [
      `Nos solutions d'impression à ${c.name}`,
      `Vos supports imprimés et livrés à ${c.name}`,
      `Imprimer et personnaliser vos supports à ${c.name}`,
    ],
    s,
    7,
  );
  const solutionsPara = pick(
    [
      `Pour une opération commerciale, un événement ou votre communication courante, J2L Print imprime à la demande l'ensemble de vos supports et les livre à ${c.name}. Chaque produit se configure en ligne : format, matière, finitions et quantité, avec des tarifs dégressifs selon le volume.`,
      `Du petit tirage à la grande série, vos supports sont produits sur des presses professionnelles puis expédiés à ${c.name}. Vous gardez la main sur chaque option — support, format, finition — directement depuis le configurateur en ligne.`,
      `Flyers, affiches, banderoles, étiquettes ou textiles : J2L Print réunit tous vos besoins d'impression au même endroit et les livre à ${c.name}, avec un contrôle du fichier avant production.`,
    ],
    s,
    8,
  );
  const livraisonHeading = pick(
    [`Livraison à ${c.name} et ${dep.dans}`, `Délais et livraison à ${c.name}`],
    s,
    9,
  );
  const livraisonSecond = neighNames.length
    ? `Nous livrons aussi les communes voisines, comme ${neighNames.slice(0, 4).join(", ")}.`
    : c.events ||
      `Marchés, animations et événements locaux rythment l'année ${de(c.name)} et appellent affiches, banderoles et PLV.`;

  const sections: ContentSection[] = [
    { heading: solutionsHeading, paragraphs: [solutionsPara] },
    {
      heading: pick(
        [`Professionnels accompagnés à ${c.name}`, `Pour qui imprimons-nous à ${c.name} ?`],
        s,
        10,
      ),
      paragraphs: [`${audiences} Parmi les profils ${de(c.name)} qui nous font confiance :`],
      bullets: sectors,
    },
    {
      heading: livraisonHeading,
      paragraphs: [
        `Vos commandes sont expédiées et livrées à ${c.name} (${c.cp}) et dans l'ensemble ${dep.de}. Le délai dépend du produit et des finitions choisies, indiqués lors de la configuration.`,
        livraisonSecond,
      ],
    },
  ];

  // ── FAQ (pool of 7, rotate-pick 5) ──
  const faqPool: FaqItem[] = [
    {
      q: `Livrez-vous à ${c.name} ?`,
      a: `Oui. J2L Print livre vos supports imprimés à ${c.name} (${c.cp}) et ${dep.dans}, directement à votre adresse professionnelle ou personnelle.`,
    },
    {
      q: `Faut-il se déplacer pour commander à ${c.name} ?`,
      a: `Non. Imprimeur en ligne, J2L Print n'a pas de boutique à ${c.name} : configuration, validation du fichier et suivi se font entièrement en ligne.`,
    },
    {
      q: `Quels produits sont disponibles ${de(c.name)} ?`,
      a: `Flyers, cartes de visite, affiches, panneaux, bâches, roll-ups, étiquettes, textiles et objets publicitaires, adaptés aux professionnels comme aux particuliers.`,
    },
    {
      q: `Quels sont les délais de livraison à ${c.name} ?`,
      a: `Le délai dépend du produit et des finitions choisies ; il est affiché lors de la configuration, avant validation de la commande.`,
    },
    {
      q: "Comment envoyer mes fichiers d'impression ?",
      a: "Vous téléversez votre fichier (PDF de préférence, 300 dpi, CMJN, fonds perdus) au moment de la commande ; un contrôle est réalisé avant impression.",
    },
    {
      q: `Comment obtenir un devis pour ${c.name} ?`,
      a: `Décrivez votre besoin dans le formulaire de devis en ligne : nous revenons vers vous avec une proposition personnalisée pour une livraison à ${c.name}.`,
    },
    {
      q: `Livrez-vous aussi autour de ${c.name} ?`,
      a: `Oui, nous desservons ${dep.dans} et ${reg.dans}${neighNames.length ? `, notamment ${neighNames.slice(0, 3).join(", ")}` : ""}.`,
    },
  ];
  const faq = rotate(faqPool, s, 5, 11);

  const productGridHeading = pick(
    [`Produits les plus demandés à ${c.name}`, `Supports populaires auprès des professionnels ${de(c.name)}`],
    s,
    12,
  );
  const productGridIntro = `Les supports les plus commandés ${de(c.name)}. Cliquez pour configurer le vôtre dans le catalogue.`;

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
      heading: `Secteurs professionnels accompagnés ${art.dans}`,
      paragraphs: ["Nos supports s'adaptent aux principaux secteurs du département :"],
      bullets: sectors,
    },
  ];
  if (d.cityNames.length) {
    sections.push({
      heading: `Principales villes desservies ${art.dans}`,
      paragraphs: ["Nous livrons l'ensemble du département, notamment :"],
      bullets: d.cityNames.slice(0, 30),
    });
  }

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
      a: "Décrivez votre besoin dans le formulaire de devis en ligne : nous vous répondons avec une proposition personnalisée.",
    },
    {
      q: `Quels délais de livraison ${art.dans} ?`,
      a: "Le délai dépend du produit et des finitions choisies ; il est indiqué lors de la configuration en ligne.",
    },
  ];
  const faq = rotate(faqPool, s, 4, 5);

  return {
    title,
    description,
    h1,
    heroEyebrow,
    heroTagline,
    intro,
    sections,
    faq,
    productGridHeading: "Produits recommandés pour votre activité",
    productGridIntro: `Les supports les plus utiles aux professionnels ${art.de}. Configurez le vôtre dans le catalogue.`,
  };
}
