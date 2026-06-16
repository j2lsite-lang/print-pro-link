// Region SEO page content (18 French regions). Real pillar pages: economic
// presentation, departments covered, main metropolises, dominant sectors,
// needs of companies/communities/associations, J2L services and a varied FAQ.
// Seed-based variation so each region page is genuinely distinct. No fake
// LocalBusiness / address.
import type { ContentSection, FaqItem } from "../types";
import { article } from "./fr";
import { seedOf } from "./geo-cities";

export interface GenRegion {
  name: string;
  slug: string;
  departmentNames: string[];
  cityNames: string[];
}

export interface RegionCopy {
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

function pick<T>(arr: T[], seed: number, salt = 0): T {
  return arr[(seed + salt) % arr.length];
}
function rotate<T>(pool: T[], seed: number, n: number, salt = 0): T[] {
  const out: T[] = [];
  const start = (seed + salt) % pool.length;
  for (let i = 0; i < Math.min(n, pool.length); i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

const WHY_ARGS = [
  "Un configurateur en ligne pour composer chaque support (format, matière, finitions, quantité).",
  "Un prix calculé en direct selon votre configuration, sans surprise.",
  "La vérification de vos fichiers avant impression (résolution, fonds perdus, CMJN).",
  "L'impression numérique et offset, selon le tirage et le rendu recherchés.",
  "Le grand format pour vos affiches, bâches, panneaux et PLV.",
  "Un devis personnalisé sous 24 h ouvrées lorsque votre projet le nécessite.",
  "La livraison partout en France, directement à votre adresse.",
  "Une gamme complète centralisée : papeterie, signalétique, textile, objets et emballages.",
];

const CTA_LABELS = [
  "Voir le catalogue",
  "Configurer un produit",
  "Découvrir tous nos supports",
  "Voir tous les produits",
];

export function regionCopy(r: GenRegion): RegionCopy {
  const s = seedOf(r.slug);
  const art = article(r.name);
  const nbDep = r.departmentNames.length;
  const metros = r.cityNames.slice(0, 6);

  const title = pick(
    [
      `Impression en ligne ${art.dans} | J2L Print`,
      `Imprimeur en ligne ${art.dans} — supports & PLV`,
      `Impression et supports personnalisés ${art.dans}`,
    ],
    s,
    1,
  );
  const h1 = pick(
    [
      `Imprimerie en ligne et supports personnalisés ${art.dans}`,
      `Impression professionnelle ${art.dans}`,
      `Votre imprimeur en ligne ${art.dans}`,
    ],
    s,
    2,
  );
  const description = pick(
    [
      `J2L Print imprime et livre ${art.dans} : flyers, affiches, bâches, PLV, textiles et objets publicitaires. Commande en ligne, livraison dans tous les départements.`,
      `Imprimerie en ligne livrant ${art.dans} et ses ${nbDep} départements : supports professionnels, devis gratuit et livraison locale.`,
    ],
    s,
    3,
  );
  const heroEyebrow = "Imprimerie en ligne · Région";
  const heroTagline = pick(
    [
      `Commandez vos supports en ligne et faites-vous livrer ${art.dans}, dans chacun de ses départements.`,
      `Une imprimerie en ligne complète au service des professionnels ${art.de}.`,
    ],
    s,
    4,
  );

  const intro = [
    `J2L Print accompagne les professionnels ${art.de} avec une imprimerie en ligne complète, livrée dans l'ensemble de la région et de ses ${nbDep} départements.`,
    `Tout se commande à distance : vous configurez votre produit, validez votre fichier et recevez votre commande sans déplacement, partout ${art.dans}.`,
  ];

  const sections: ContentSection[] = [
    {
      heading: `Une région, ${nbDep} départements desservis`,
      paragraphs: [
        `${art.dans[0].toUpperCase() + art.dans.slice(1)}, J2L Print couvre un territoire à l'économie variée — métropoles, bassins industriels, zones rurales, tourisme et commerces — avec une seule plateforme d'impression en ligne livrant chaque département.`,
      ],
      bullets: r.departmentNames.slice(0, 15),
    },
  ];
  if (metros.length) {
    sections.push({
      heading: `Principales métropoles desservies ${art.dans}`,
      paragraphs: ["Des grandes villes aux communes rurales, nous livrons notamment :"],
      bullets: r.cityNames.slice(0, 24),
    });
  }
  sections.push({
    heading: `Des supports pour les entreprises, collectivités et associations ${art.de}`,
    paragraphs: [
      `Entreprises et industries, commerces et artisans, collectivités, établissements et associations : chacun trouve ${art.dans} les supports adaptés à sa communication. J2L Print imprime aussi bien la papeterie d'entreprise que la signalétique, le grand format, les textiles et les objets publicitaires.`,
    ],
  });
  sections.push({
    heading: "Pourquoi choisir J2L Print ?",
    paragraphs: [`Une imprimerie en ligne complète, pensée pour les professionnels ${art.de} :`],
    bullets: rotate(WHY_ARGS, s, 6, 13),
  });

  const faqPool: FaqItem[] = [
    {
      q: `Livrez-vous partout ${art.dans} ?`,
      a: `Oui. J2L Print livre dans tous les départements de la région ${r.name}, des grandes villes aux communes rurales.`,
    },
    {
      q: "Faut-il se déplacer pour commander ?",
      a: `Non. Imprimeur en ligne, J2L Print ne dispose d'aucune boutique physique ${art.dans} : tout se fait à distance.`,
    },
    {
      q: `Quels supports imprimez-vous ${art.dans} ?`,
      a: "Flyers, cartes de visite, dépliants, brochures, affiches, panneaux, bâches, roll-up, étiquettes, adhésifs, textiles et objets publicitaires.",
    },
    {
      q: "Comment obtenir un devis ?",
      a: "Configurez votre produit pour un prix immédiat, ou décrivez votre besoin dans le formulaire de devis : nous revenons vers vous avec une proposition personnalisée.",
    },
    {
      q: "Les fichiers sont-ils vérifiés avant impression ?",
      a: "Oui, chaque fichier est contrôlé (résolution, fonds perdus, CMJN) avant production pour garantir un rendu fidèle.",
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
    productGridHeading: "Supports les plus demandés",
    productGridIntro: `Les supports les plus commandés par les professionnels ${art.de}. Configurez le vôtre dans le catalogue.`,
    ctaLabel: pick(CTA_LABELS, s, 15),
  };
}
