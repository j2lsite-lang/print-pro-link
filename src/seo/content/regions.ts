// Region SEO page content (18 French regions). Seed-based variation so each
// region page is genuinely distinct: real department list, real major cities,
// varied templates and FAQ subset. No fake LocalBusiness / address.
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

export function regionCopy(r: GenRegion): RegionCopy {
  const s = seedOf(r.slug);
  const art = article(r.name);
  const nbDep = r.departmentNames.length;

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
      heading: `Départements desservis ${art.dans}`,
      paragraphs: [`Nous livrons l'ensemble des départements de la région, parmi lesquels :`],
      bullets: r.departmentNames.slice(0, 15),
    },
  ];
  if (r.cityNames.length) {
    sections.push({
      heading: `Principales villes desservies ${art.dans}`,
      paragraphs: ["Des métropoles aux communes rurales, nous livrons notamment :"],
      bullets: r.cityNames.slice(0, 24),
    });
  }

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
      a: "Flyers, cartes de visite, affiches, panneaux, bâches, roll-ups, étiquettes, textiles et objets publicitaires.",
    },
    {
      q: "Comment obtenir un devis ?",
      a: "Décrivez votre besoin dans le formulaire de devis en ligne : nous revenons vers vous avec une proposition personnalisée.",
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
    productGridHeading: "Supports les plus demandés",
    productGridIntro: `Les supports les plus commandés par les professionnels ${art.de}. Configurez le vôtre dans le catalogue.`,
  };
}
