// Search Console priority pages (positions 8–30, ≥40 impressions, 28 days to
// 2026-10-11). Adds contextual internal links toward them from their real
// parent rubriques (département, région, sous-catégorie, catégorie, annuaire).
// Never creates URLs: targets missing from the generated set are skipped.
import type { SeoPage } from "../../src/seo/types";

export const PRIORITY_ANCHORS: Record<string, string> = {
  "/": "imprimerie en ligne J2L Print",
  "/region/guadeloupe": "imprimerie en ligne en Guadeloupe",
  "/region/mayotte": "imprimerie en ligne à Mayotte",
  "/ville/saint-louis": "imprimerie à Saint-Louis",
  "/ville/pointe-a-pitre": "imprimerie à Pointe-à-Pitre",
  "/departement/la-reunion": "imprimerie en ligne à La Réunion",
  "/ville/epinal": "imprimerie à Épinal",
  "/ville/louviers": "imprimerie à Louviers",
  "/products/magnet-posters": "affiche magnétique personnalisée",
  "/ville/vernon": "imprimerie étiquettes à Vernon",
  "/departement/mayenne": "imprimerie en ligne en Mayenne",
  "/ville/auxerre": "imprimerie à Auxerre",
  "/ville/thionville": "imprimerie à Thionville",
  "/ville/troyes": "imprimerie à Troyes",
  "/ville/saverne": "imprimerie à Saverne",
  "/ville/rennes": "imprimerie à Rennes",
  "/ville/sotteville-les-rouen": "imprimerie à Sotteville-lès-Rouen",
  "/ville/reims": "imprimerie à Reims",
  "/products/click-clack-can": "boîte clic clac publicitaire",
  "/products/business-stationery": "papeterie d'entreprise personnalisée",
  "/categorie/etiquettes-stickers": "impression d'étiquettes et stickers",
  "/ville/montbeliard": "imprimerie à Montbéliard",
  "/ville/dieppe": "imprimerie à Dieppe",
  "/products/food-wrappers": "bague sandwich personnalisée",
  "/departement/bas-rhin": "imprimerie en ligne Bas-Rhin",
  "/products/textile-stretcher-frames": "cadre textile tendu personnalisé",
  "/ville/pau": "imprimerie à Pau",
  "/ville/roanne": "impression à Roanne",
  "/products/photo-decotex": "toile photo Decotex personnalisée",
  "/ville/bordeaux": "impression supports publicitaires à Bordeaux",
  "/ville/nevers": "kakemono et impression à Nevers",
};

const HEADING = "Pages recherchées";

export function applyPriorityLinks(byPath: Record<string, SeoPage>, products: Record<string, SeoPage>) {
  let added = 0;
  const sources = new Set<string>();
  const add = (src: string, target: string) => {
    const page = byPath[src];
    if (!page || src === target) return;
    const groups = (page.internalLinks ||= []);
    if (groups.some((g) => g.links.some((l) => l.path === target))) return;
    let g = groups.find((x) => x.heading === HEADING);
    if (!g) { g = { heading: HEADING, links: [] }; groups.push(g); }
    g.links.push({ label: PRIORITY_ANCHORS[target], path: target });
    added++; sources.add(src);
  };
  for (const target of Object.keys(PRIORITY_ANCHORS)) {
    const t = byPath[target] || products[target];
    if (!t) continue;
    const crumbs = t.breadcrumb.map((b) => b.path).filter((p) => p !== target && p !== "/" && p !== "/catalogue");
    if (target === "/") ["/imprimerie", "/catalogue"].forEach((s) => add(s, target));
    else if (target.startsWith("/categorie/")) ["/catalogue", "/supports-publicitaires", "/impression-numerique"].forEach((s) => add(s, target));
    else crumbs.forEach((s) => add(s, target));
  }
  return { added, sources: [...sources] };
}
