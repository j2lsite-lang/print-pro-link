import { readFileSync } from "fs";
import type { SeoPage } from "../../src/seo/types";

/** Extract existing editorial content only, without inventing new claims. */
export function editorialPages(): SeoPage[] {
  const definitions = [
    ["Blog", "/blog", "Blog – Conseils impression et communication visuelle", "Retrouvez nos articles et conseils sur l'impression : préparation de fichiers, finitions, choix de supports, communication visuelle pour professionnels."],
    ["Livraison", "/livraison", "Livraison – Délais et tarifs d'expédition", "Informations sur la livraison J2L Print : délais indiqués produit par produit, expédition France et Europe, suivi de colis."],
    ["MentionsLegales", "/mentions-legales", "Mentions légales", "Mentions légales du site J2L Print, marque exploitée par J2L Publicité : éditeur, hébergement et informations légales."],
    ["CGV", "/cgv", "Conditions Générales de Vente", "Conditions Générales de Vente J2L Publicité pour les demandes de devis, commandes, validation du BAT et produits personnalisés J2L Print."],
    ["PolitiqueRetours", "/politique-retours", "Retours et remboursements", "Conditions de retour, de réclamation et de remboursement des produits personnalisés J2L Print."],
    ["PolitiqueConfidentialite", "/politique-confidentialite", "Politique de confidentialité", "Politique de confidentialité J2L Print : données personnelles, demandes de devis et droits des utilisateurs."],
  ];
  const text = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\{[^}]*\}/g, " ").replace(/\s+/g, " ").trim();
  return definitions.map(([file, path, title, description]) => {
    const source = readFileSync(`src/pages/${file}.tsx`, "utf8");
    const h1 = text(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] || title);
    const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => text(m[1])).filter(Boolean);
    const sections = [...source.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/g)].map((m) => ({
      heading: text(m[1]),
      paragraphs: [...m[2].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((p) => text(p[1])).filter(Boolean),
      bullets: [...m[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((p) => text(p[1])).filter(Boolean),
    }));
    if (file === "Blog") {
      for (const post of source.matchAll(/title: "([^"]+)",[\s\S]*?content: `([^`]+)`/g)) {
        sections.push({ heading: post[1], paragraphs: [post[2].replace(/\*\*/g, "")], bullets: [] });
      }
    }
    return { path, title, description, h1, intro: paragraphs.slice(0, 1), sections,
      breadcrumb: [{ name: "Accueil", path: "/" }, { name: h1, path }],
      internalLinks: [{ heading: "J2L Print", links: [{ label: "Catalogue", path: "/products" }] }],
      jsonLd: [],
    };
  });
}