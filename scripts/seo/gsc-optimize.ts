// Search Console (3 mois) — pages déjà proches de la 1re page ou à fort volume
// d'impressions mal classées. Ajuste title/meta/H1/intro et ajoute un bloc de
// liens vers les pages locales/catégories EXISTANTES correspondant aux requêtes
// GSC. Ne crée aucune URL : une page absente du jeu généré est ignorée.
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { SeoPage } from "../../src/seo/types";

type Opt = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** [ancre, chemin] — ajouté seulement si la cible existe */
  links?: [string, string][];
};

const L = (city: string, slug: string) => `/ville/${city}/${slug}`;

export const GSC_PAGES: Record<string, Opt> = {
  "/ville/rennes": {
    title: "Imprimerie à Rennes : impression livrée en France | J2L Print",
    description: "Imprimerie pour Rennes (35) : flyers, cartes de visite, affiches, bâches et roll-up. Configuration simple, prix affiché immédiatement, livraison en France.",
    h1: "Imprimerie à Rennes : vos impressions professionnelles en ligne",
    intro: "Vous cherchez une imprimerie à Rennes ? Configurez vos flyers, cartes de visite, affiches ou bâches en ligne : le prix s'affiche immédiatement et la commande est livrée à Rennes et en Ille-et-Vilaine.",
    links: [["impression de flyers à Rennes", L("rennes", "flyers")], ["cartes de visite à Rennes", L("rennes", "cartes-de-visite")], ["impression grand format à Rennes", L("rennes", "panneaux-baches-grand-format")]],
  },
  "/ville/sotteville-les-rouen": {
    title: "Imprimerie étiquettes à Sotteville-lès-Rouen | J2L Print",
    description: "Imprimerie à Sotteville-lès-Rouen (76) : étiquettes, stickers, flyers et supports publicitaires. Prix affiché en ligne et livraison en France.",
    h1: "Imprimerie à Sotteville-lès-Rouen : étiquettes, stickers et impressions",
    intro: "Pour vos étiquettes produits, stickers et supports imprimés à Sotteville-lès-Rouen, choisissez format, matière et quantité en ligne : le prix s'affiche directement et la livraison se fait en Seine-Maritime.",
    links: [["imprimerie étiquettes à Sotteville-lès-Rouen", L("sotteville-les-rouen", "etiquettes-stickers")], ["stickers personnalisés à Sotteville-lès-Rouen", L("sotteville-les-rouen", "stickers")], ["flyers à Sotteville-lès-Rouen", L("sotteville-les-rouen", "flyers")]],
  },
  "/ville/laon": {
    title: "Imprimerie à Laon : grand format et impression | J2L Print",
    description: "Impression grand format à Laon (02) : bâches, panneaux, roll-up, mais aussi flyers et affiches. Prix affiché en ligne et livraison en France.",
    h1: "Imprimerie à Laon : impression grand format et supports pros",
    intro: "Bâches, panneaux rigides, roll-up ou affiches : à Laon, configurez votre impression grand format en ligne, avec un prix affiché immédiatement et une livraison dans l'Aisne.",
    links: [["impression grand format à Laon", L("laon", "panneaux-baches-grand-format")], ["bâches publicitaires à Laon", L("laon", "baches-publicitaires")], ["roll-up à Laon", L("laon", "roll-up")]],
  },
  "/ville/saint-claude": {
    title: "Imprimerie à Saint-Claude : grand format, flyers | J2L Print",
    description: "Impression grand format à Saint-Claude (39) : bâches, panneaux, roll-up et affiches. Configuration sur mesure, prix affiché et livraison en France.",
    h1: "Imprimerie à Saint-Claude : impression grand format et supports",
    intro: "À Saint-Claude, commandez vos bâches, panneaux, roll-up et affiches en ligne : choisissez dimensions et finitions, le prix s'affiche aussitôt et la commande est livrée dans le Jura.",
    links: [["impression grand format à Saint-Claude", L("saint-claude", "panneaux-baches-grand-format")], ["bâches publicitaires à Saint-Claude", L("saint-claude", "baches-publicitaires")], ["affiches à Saint-Claude", L("saint-claude", "affiches")]],
  },
  "/ville/troyes": {
    title: "Imprimerie à Troyes : impression de flyers | J2L Print",
    description: "Impression de flyers à Troyes (10) : dépliants, cartes de visite, affiches et bâches aussi. Configuration simple, prix affiché, livraison en France.",
    h1: "Imprimerie à Troyes : flyers, affiches et supports imprimés",
    intro: "Besoin d'imprimer des flyers à Troyes ? Choisissez format, papier, recto ou recto verso et quantité : le prix s'affiche en ligne et vos impressions sont livrées dans l'Aube.",
    links: [["impression flyer à Troyes", L("troyes", "flyers")], ["dépliants à Troyes", L("troyes", "depliants")], ["cartes de visite à Troyes", L("troyes", "cartes-de-visite")]],
  },
  "/ville/epinal": {
    title: "Imprimerie à Épinal : textiles personnalisés et print | J2L Print",
    description: "Imprimerie à Épinal (88) : textiles personnalisés, flyers, cartes de visite, bâches et objets publicitaires. Prix affiché, livraison en France.",
    h1: "Imprimerie à Épinal : textiles personnalisés et impressions pros",
    intro: "À Épinal, personnalisez t-shirts, polos et sweats à votre logo, ou commandez flyers, cartes de visite et bâches : tout se configure en ligne avec un prix affiché immédiatement.",
    links: [["textiles personnalisés à Épinal", L("epinal", "textiles-personnalises")], ["flyers à Épinal", L("epinal", "flyers")], ["objets publicitaires à Épinal", L("epinal", "objets-publicitaires")]],
  },
  "/ville/colmar": {
    title: "Imprimerie à Colmar : textiles personnalisés et print | J2L Print",
    description: "Imprimerie à Colmar (68) : textiles personnalisés, flyers, affiches, bâches et objets publicitaires. Prix affiché en ligne et livraison en France.",
    h1: "Imprimerie à Colmar : textiles personnalisés et impressions pros",
    intro: "À Colmar, faites marquer vos textiles à votre logo ou imprimez flyers, affiches et bâches : configuration en ligne, prix affiché immédiatement, livraison dans le Haut-Rhin.",
    links: [["textiles personnalisés à Colmar", L("colmar", "textiles-personnalises")], ["flyers à Colmar", L("colmar", "flyers")], ["impression grand format à Colmar", L("colmar", "panneaux-baches-grand-format")]],
  },
  "/ville/metz": {
    title: "Imprimerie à Metz : impression grand format | J2L Print",
    description: "Impression grand format à Metz (57) : bâches, panneaux, roll-up, beach flags, flyers et affiches. Prix affiché en ligne et livraison en France.",
    h1: "Imprimerie à Metz : impression grand format et supports pros",
    intro: "À Metz, configurez en ligne vos bâches, panneaux, roll-up et beach flags, ainsi que vos flyers et affiches : prix affiché immédiatement et livraison en Moselle.",
    links: [["impression grand format à Metz", L("metz", "panneaux-baches-grand-format")], ["roll-up à Metz", L("metz", "roll-up")], ["bâches publicitaires à Metz", L("metz", "baches-publicitaires")]],
  },
  "/ville/bordeaux": {
    title: "Imprimerie à Bordeaux : supports publicitaires | J2L Print",
    description: "Supports publicitaires à Bordeaux (33) : roll-up, PLV, bâches, flyers et affiches pour salons et boutiques. Prix affiché, livraison en France.",
    h1: "Imprimerie à Bordeaux : impression de supports publicitaires",
    intro: "À Bordeaux, imprimez roll-up, PLV, bâches, flyers et affiches pour vos salons, boutiques et événements : configuration en ligne, prix affiché et livraison en Gironde.",
    links: [["supports publicitaires PLV à Bordeaux", L("bordeaux", "publicite-interieure-plv")], ["roll-up à Bordeaux", L("bordeaux", "roll-up")], ["flyers à Bordeaux", L("bordeaux", "flyers")]],
  },
  "/departement/bas-rhin": {
    title: "Imprimerie en ligne Bas-Rhin (67) | J2L Print",
    description: "Imprimerie en ligne dans le Bas-Rhin (67) : flyers, cartes de visite, bâches, roll-up et textiles pour Strasbourg, Haguenau, Sélestat. Prix immédiat.",
    h1: "Imprimerie en ligne dans le Bas-Rhin (67)",
    intro: "Imprimerie en ligne pour le Bas-Rhin : configurez flyers, cartes de visite, bâches, roll-up ou textiles personnalisés, le prix s'affiche immédiatement et la livraison couvre Strasbourg, Haguenau, Sélestat et tout le département.",
    links: [["flyers dans le Bas-Rhin", "/departement/bas-rhin/flyers"], ["impression grand format Bas-Rhin", "/departement/bas-rhin/panneaux-baches-grand-format"], ["imprimerie à Strasbourg", "/ville/strasbourg"]],
  },
  "/personnalisation": {
    title: "Personnalisation textile et objets avec logo | J2L Print",
    description: "Personnalisation textile et objets avec logo : t-shirts, polos, sweats, mugs, stylos, tote bags. Sérigraphie, broderie, transfert. Livraison en France.",
    h1: "Personnalisation textile & objets publicitaires",
    intro: "",
    links: [["textiles personnalisés", "/categorie/textiles-accessoires"], ["objets publicitaires personnalisés", "/categorie/objets-publicitaires-cadeaux"], ["sacs et tote bags personnalisés", "/categorie/emballages-sacs"]],
  },
  "/categorie/objets-publicitaires-cadeaux": {
    title: "Objets publicitaires personnalisés avec logo | J2L Print",
    description: "Objets publicitaires avec votre logo : stylos, mugs, gourdes, tote bags, goodies et cadeaux d'entreprise. Prix affiché en ligne, livraison en France.",
    h1: "Objets publicitaires personnalisés avec votre logo",
    intro: "Stylos, mugs, gourdes, tote bags, carnets ou gadgets : choisissez votre objet publicitaire, sa technique de marquage et la quantité, et le prix unitaire s'affiche directement en ligne.",
  },
  "/impression-numerique": {
    title: "Impression numérique : flyers, cartes, affiches | J2L Print",
    description: "Impression numérique pour professionnels : flyers, cartes de visite, dépliants, affiches et brochures, petites et grandes séries. Livraison en France.",
    h1: "Impression numérique professionnelle en ligne",
    intro: "",
  },
  "/categorie/textiles-accessoires": {
    title: "Textiles personnalisés avec logo : t-shirts, polos | J2L Print",
    description: "Textiles personnalisés avec logo : t-shirts, polos, sweats et casquettes en sérigraphie, broderie ou transfert. Prix affiché, livraison en France.",
    h1: "Textiles personnalisés avec logo pour entreprises et équipes",
    intro: "T-shirts, polos, sweats, casquettes : choisissez le modèle, la couleur, les tailles et les zones de marquage de votre logo, le prix se calcule directement en ligne.",
  },
  "/categorie/emballages-sacs": {
    title: "Emballages et sacs personnalisés avec logo | J2L Print",
    description: "Sacs papier, tote bags, boîtes et emballages avec votre logo pour boutiques, restaurants et événements. Prix affiché en ligne, livraison en France.",
    h1: "Emballages et sacs personnalisés avec votre logo",
    intro: "Sacs papier, tote bags, boîtes et emballages alimentaires : imprimez votre logo sur les emballages remis à vos clients, avec un prix affiché dès la configuration.",
  },
};

let localCache: Set<string> | null = null;
function localPathExists(p: string): boolean {
  const m = p.match(/^\/(ville|departement|region)\/([^/]+)\/[^/]+$/);
  if (!m) return false;
  if (!localCache) localCache = new Set();
  const f = resolve("public/seo-local", m[1], `${m[2]}.json`);
  if (!existsSync(f)) return false;
  return p in JSON.parse(readFileSync(f, "utf8"));
}

const HEADING = "Recherches fréquentes";

export function applyGscOptimizations(byPath: Record<string, SeoPage>) {
  const touched: string[] = [];
  let links = 0;
  for (const [path, o] of Object.entries(GSC_PAGES)) {
    const p = byPath[path];
    if (!p) continue;
    p.title = o.title;
    p.description = o.description;
    p.h1 = o.h1;
    if (o.intro && !p.intro.includes(o.intro)) p.intro = [o.intro, ...p.intro];
    const valid = (o.links || []).filter(([, t]) => t !== path && (byPath[t] || localPathExists(t)));
    const groups = (p.internalLinks ||= []);
    const existing = new Set(groups.flatMap((g) => g.links.map((l) => l.path)));
    const fresh = valid.filter(([, t]) => !existing.has(t)).map(([label, t]) => ({ label, path: t }));
    if (fresh.length) { groups.unshift({ heading: HEADING, links: fresh }); links += fresh.length; }
    touched.push(path);
  }
  return { touched, links };
}
