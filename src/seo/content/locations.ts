// Differentiated content for city and department pages.
// Uses real data (name, department, region, postal code) PLUS per-city
// economic profiles (src/seo/content/local.ts) so pages are meaningfully
// distinct, not name-swapped.
// IMPORTANT: never claim a physical shop/workshop in the city — J2L Print
// is an online printer delivering across France.
import type { ContentSection, FaqItem } from "../types";
import { de, article } from "./fr";
import { CITY_PROFILES, type CityProfile } from "./local";

export interface CityData {
  slug: string;
  name: string;
  department: string;
  region: string;
  cp: string;
}

function profileFor(c: CityData): CityProfile {
  return (
    CITY_PROFILES[c.slug] || {
      economy: `${c.name} s'appuie sur un tissu de commerces, d'artisans et de petites entreprises ${article(c.department).de}.`,
      sectors: [
        "Commerces et boutiques de proximité",
        "Artisans et TPE locales",
        "Associations et clubs sportifs",
        "Professions libérales et services",
        "Collectivités et acteurs publics",
      ],
      audiences: `Commerçants, artisans et associations ${de(c.name)} commandent leurs supports en ligne et sont livrés sur place.`,
      events: `Marchés, animations et événements locaux rythment l'année ${de(c.name)} et appellent affiches et banderoles.`,
      neighbors: [],
      hero: 1,
    }
  );
}

export function cityIntro(c: CityData): string[] {
  const p = profileFor(c);
  return [
    `${p.economy} J2L Print y livre tous vos supports de communication imprimés en ligne, sans déplacement : vous configurez, validez votre fichier, et recevez votre commande à ${c.name} (${c.cp}).`,
    `${p.audiences} J2L Print n'a pas d'imprimerie physique à ${c.name} : c'est un service d'impression en ligne avec livraison rapide ${article(c.region).dans}, pensé pour commander à distance sans renoncer à la qualité.`,
  ];
}

export function citySections(c: CityData): ContentSection[] {
  const p = profileFor(c);
  return [
    {
      heading: `Nos solutions d'impression à ${c.name}`,
      paragraphs: [
        `Que vous prépariez une opération commerciale, un événement ou votre communication courante, J2L Print imprime à la demande l'ensemble de vos supports et les livre à ${c.name}. Chaque produit se configure en ligne : format, matière, finitions et quantité, avec des tarifs dégressifs.`,
      ],
    },
    {
      heading: "Impression pour les professionnels locaux",
      paragraphs: [
        `${p.audiences} Voici les profils ${de(c.name)} qui nous font confiance :`,
      ],
      bullets: p.sectors,
    },
    {
      heading: `Livraison à ${c.name} et dans le département`,
      paragraphs: [
        `Vos commandes sont expédiées et livrées à ${c.name} (${c.cp}) et dans l'ensemble du département ${c.department}. Le délai dépend du produit et des finitions choisies, indiqués lors de la configuration.`,
        p.events,
      ],
    },
  ];
}

export function cityFaq(c: CityData): FaqItem[] {
  const p = profileFor(c);
  return [
    {
      q: `Livrez-vous à ${c.name} ?`,
      a: `Oui. J2L Print livre vos supports imprimés à ${c.name} (${c.cp}) et ${article(c.department).dans}, directement à votre adresse professionnelle ou personnelle.`,
    },
    {
      q: "Peut-on commander sans se déplacer ?",
      a: `Entièrement. Vous configurez votre produit en ligne, téléversez votre fichier et validez : aucun déplacement n'est nécessaire. J2L Print n'a pas de boutique à ${c.name}.`,
    },
    {
      q: `Quels produits sont disponibles pour les entreprises ${de(c.name)} ?`,
      a: `Flyers, cartes de visite, affiches, panneaux, bâches, roll-ups, étiquettes, textiles et objets publicitaires — adaptés ${p.sectors.length ? "aux " + p.sectors[0].toLowerCase() : "aux professionnels locaux"} comme aux grandes organisations.`,
    },
    {
      q: "Comment envoyer mes fichiers ?",
      a: "Vous téléversez votre fichier (PDF de préférence, 300 dpi, CMJN, fonds perdus) au moment de la commande. Un contrôle est effectué avant impression.",
    },
    {
      q: "Comment demander un devis ?",
      a: `Remplissez le formulaire de devis en ligne en décrivant votre besoin : nous revenons vers vous avec une proposition personnalisée pour une livraison à ${c.name}.`,
    },
  ];
}
