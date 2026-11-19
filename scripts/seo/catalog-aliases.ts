import type { SeoPage } from "../../src/seo/types";

/** Retain the working catalog browsing URLs and their existing canonicals. */
export function catalogAliases(pages: Record<string, SeoPage>): Record<string, SeoPage> {
  const aliases: Record<string, SeoPage> = {};
  const catalog = pages["/catalogue"];
  if (catalog) aliases["/products"] = {
    ...catalog, path: "/products", h1: "Catégories",
    title: "Catalogue produits – Impression en ligne",
    description: "Parcourez notre catalogue d'impression : flyers, cartes de visite, affiches, bâches, adhésifs, textiles, objets publicitaires. Commandez en ligne, livraison en France.",
    jsonLd: catalog.jsonLd.map((block) => JSON.parse(JSON.stringify(block).split("https://j2lprint.fr/catalogue").join("https://j2lprint.fr/products"))),
  };
  const categories = Object.values(pages).filter((p) => p.path.startsWith("/categorie/"));
  const bySlug = new Map<string, SeoPage[]>();
  for (const page of categories) {
    const slug = page.path.split("/").at(-1) || "";
    bySlug.set(slug, [...(bySlug.get(slug) || []), page]);
  }
  for (const [slug, matches] of bySlug) {
    // A slug shared by two parents is ambiguous: never guess its canonical.
    if (matches.length !== 1) continue;
    const page = matches[0];
    aliases[`/products/category/${slug}`] = {
      ...page, path: `/products/category/${slug}`, canonicalPath: page.path,
    };
  }
  return aliases;
}