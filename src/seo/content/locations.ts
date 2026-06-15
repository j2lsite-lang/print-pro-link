// Differentiated content for city and department pages.
// Uses real data (name, department, region, postal code) plus rotating
// editorial angles so pages are meaningfully distinct, not name-swapped.
// IMPORTANT: never claim a physical shop/workshop in the city — J2L Print
// is an online printer delivering across France.
import type { ContentSection, FaqItem } from "../types";

export interface CityData {
  slug: string;
  name: string;
  department: string;
  region: string;
  cp: string;
}

// Rotating intro angles — selected by a stable hash of the slug so each
// city gets a different editorial entry point.
const CITY_ANGLES: ((c: CityData) => string)[] = [
  (c) =>
    `Vous cherchez un imprimeur fiable pour vos supports à ${c.name} ? J2L Print imprime vos flyers, cartes de visite, banderoles et PLV en ligne et vous livre directement à ${c.name} (${c.cp}), sans déplacement.`,
  (c) =>
    `Les professionnels de ${c.name} et du secteur ${c.department.toLowerCase()} commandent leur impression en quelques clics : configuration en ligne, validation du fichier, puis livraison à ${c.name}.`,
  (c) =>
    `Commerçants, artisans et entreprises de ${c.name} disposent avec J2L Print d'une imprimerie en ligne complète : large catalogue, prix transparents et livraison dans le ${c.department}.`,
  (c) =>
    `À ${c.name}, gagnez du temps sur vos impressions professionnelles : tout se configure en ligne et vos supports sont livrés sur place, en ${c.region}.`,
];

const CITY_USE_BLOCKS: ((c: CityData) => ContentSection)[] = [
  (c) => ({
    heading: `Quels supports imprimer à ${c.name} ?`,
    bullets: [
      "Flyers et dépliants pour la prospection locale",
      "Cartes de visite et papeterie d'entreprise",
      "Affiches et PLV pour les commerces",
      "Banderoles et panneaux pour vos événements",
    ],
  }),
  (c) => ({
    heading: `Une imprimerie en ligne au service des entreprises de ${c.name}`,
    paragraphs: [
      `Pas besoin de boutique physique : vous configurez vos produits en ligne, profitez de tarifs dégressifs selon la quantité, et recevez votre commande à ${c.name}. C'est la solution adoptée par de nombreuses TPE, PME et associations du ${c.department}.`,
    ],
  }),
];

export function cityIntro(c: CityData): string[] {
  const idx = hash(c.slug) % CITY_ANGLES.length;
  return [
    CITY_ANGLES[idx](c),
    `J2L Print n'est pas une imprimerie physique à ${c.name} : c'est un service d'impression en ligne avec livraison rapide dans toute la ${c.region}, pensé pour les professionnels qui veulent commander à distance sans renoncer à la qualité.`,
  ];
}

export function citySections(c: CityData): ContentSection[] {
  const i = hash(c.slug);
  return [
    CITY_USE_BLOCKS[i % CITY_USE_BLOCKS.length](c),
    CITY_USE_BLOCKS[(i + 1) % CITY_USE_BLOCKS.length](c),
    {
      heading: `Livraison à ${c.name} et dans le ${c.department}`,
      paragraphs: [
        `Vos commandes sont expédiées et livrées à ${c.name} (${c.cp}) et dans l'ensemble du département ${c.department}. Le délai dépend du produit et des finitions choisies, indiqués lors de la configuration.`,
      ],
    },
  ];
}

export function cityFaq(c: CityData): FaqItem[] {
  return [
    {
      q: `J2L Print a-t-il une imprimerie à ${c.name} ?`,
      a: `Non. J2L Print est une imprimerie en ligne : vous commandez à distance et nous livrons vos supports à ${c.name} et dans le ${c.department}.`,
    },
    {
      q: `Livrez-vous les professionnels de ${c.name} ?`,
      a: `Oui, nous livrons les entreprises, commerces, artisans et associations de ${c.name} et de la ${c.region}.`,
    },
    {
      q: "Comment passer commande ?",
      a: "Choisissez votre produit, configurez les options et le format, téléversez votre fichier, puis validez : vous êtes livré sans vous déplacer.",
    },
  ];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
