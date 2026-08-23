// ============================================================================
// Secteurs professionnels & occasions — contenu FACTUEL, sans promesse.
// ----------------------------------------------------------------------------
// Associe chaque univers RÉEL du catalogue J2L Print (8 catégories racines) aux
// métiers/clientèles et aux occasions qui correspondent vraiment aux produits
// de cet univers, puis produit :
//   • des puces visibles (sections H2 rendues côté serveur = Googlebot)
//   • des expressions de recherche naturelles (métier / événement / local)
// Aucun prix, délai, capacité de production ni certification n'est évoqué.
// Aucun produit, format ou matière n'est inventé : seuls les univers réels du
// catalogue déclenchent une association.
// ============================================================================

export interface SectorEntry {
  /** Libellé du métier / de la clientèle */
  label: string;
  /** Mot-clé racine utilisé dans les requêtes ("restaurant", "association"…) */
  query: string;
  /** Supports réellement adaptés, formulés avec les produits du catalogue */
  supports: string;
}

export interface EventEntry {
  label: string;
  query: string;
  supports: string;
}

/* -------------------------------------------------------------------------- */
/* Secteurs par univers réel du catalogue                                      */
/* -------------------------------------------------------------------------- */
const S = (label: string, query: string, supports: string): SectorEntry => ({ label, query, supports });
const E = (label: string, query: string, supports: string): EventEntry => ({ label, query, supports });

export const SECTORS_BY_UNIVERSE: Record<string, SectorEntry[]> = {
  "impression-papier": [
    S("Entreprises, TPE et PME", "entreprise", "cartes de visite, papier à en-tête, plaquettes et dépliants"),
    S("Artisans et indépendants", "artisan", "cartes de visite, flyers et dépliants de présentation"),
    S("Commerces, magasins et boutiques", "commerce", "flyers, prospectus et cartes de fidélité"),
    S("Restaurants, bars, food-trucks et boulangeries", "restaurant", "menus, sets de table, flyers et cartes de visite"),
    S("Agences immobilières et syndics", "agence immobilière", "plaquettes, flyers et cartes de visite"),
    S("Associations, clubs sportifs et collectivités", "association", "flyers, programmes, invitations et affiches"),
    S("Écoles, universités et organismes de formation", "école", "brochures, livrets et catalogues"),
    S("Santé, pharmacies, opticiens et professions libérales", "professions libérales", "cartes de rendez-vous, dépliants et papeterie"),
    S("Agences de communication et organisateurs d'événements", "agence de communication", "brochures, catalogues et invitations"),
  ],
  "publicite-exterieure": [
    S("BTP, artisans du bâtiment et promoteurs", "chantier", "panneaux de chantier, bâches et banderoles"),
    S("Agences immobilières et promoteurs", "immobilier", "panneaux immobiliers et affiches vitrine"),
    S("Commerces, magasins et centres commerciaux", "commerce", "bâches de façade, banderoles et affiches grand format"),
    S("Clubs sportifs et associations", "club sportif", "bâches de stade, banderoles et calicots"),
    S("Collectivités, mairies et offices de tourisme", "mairie", "banderoles, affiches et signalétique extérieure"),
    S("Campings, hôtels et sites touristiques", "camping", "bâches, panneaux directionnels et banderoles"),
    S("Garages, concessions et centres auto", "garage", "bâches promotionnelles et panneaux extérieurs"),
  ],
  "publicite-interieure": [
    S("Entreprises et exposants sur salons", "salon professionnel", "roll-ups, kakémonos, comptoirs et stands"),
    S("Commerces et points de vente", "magasin", "PLV, totems et présentoirs"),
    S("Agences immobilières, banques et assurances", "agence", "roll-ups d'accueil et panneaux d'information"),
    S("Salles de sport, instituts et coiffeurs", "salle de sport", "kakémonos, PLV et affichage intérieur"),
    S("Collectivités, écoles et organismes de formation", "collectivité", "roll-ups institutionnels et signalétique intérieure"),
    S("Organisateurs de salons, congrès et séminaires", "congrès", "totems, stands et supports d'exposition"),
  ],
  "etiquettes-stickers": [
    S("Producteurs, viticulteurs et artisans de bouche", "étiquette produit", "étiquettes adhésives et étiquettes en rouleau"),
    S("Commerces et boutiques", "vitrine", "stickers vitrine, vitrophanie et autocollants promotionnels"),
    S("Transport, logistique et industrie", "logistique", "étiquettes d'identification et autocollants adhésifs"),
    S("Garages, artisans et sociétés avec flotte de véhicules", "véhicule", "autocollants véhicule et stickers découpés à la forme"),
    S("Associations et clubs", "association", "stickers logo et autocollants promotionnels"),
  ],
  "emballages-sacs": [
    S("Commerces, boutiques et prêt-à-porter", "sac boutique", "sacs personnalisés et emballages avec logo"),
    S("Restaurants, boulangeries et commerces alimentaires", "restauration", "emballages personnalisés et sacs pour la vente à emporter"),
    S("E-commerce et vente à distance", "e-commerce", "packaging personnalisé et boîtes d'expédition imprimées"),
    S("Entreprises et marques", "marque", "packaging avec logo et emballages publicitaires"),
  ],
  "objets-publicitaires-cadeaux": [
    S("Entreprises, TPE et PME", "objet publicitaire entreprise", "stylos, mugs, carnets et gourdes personnalisés"),
    S("Salons, foires et opérations commerciales", "goodies salon", "goodies publicitaires et cadeaux clients"),
    S("Associations, clubs et collectivités", "goodies association", "objets publicitaires avec logo"),
    S("Écoles, universités et BDE", "goodies étudiants", "objets personnalisés pour événements étudiants"),
  ],
  "textiles-accessoires": [
    S("Entreprises et équipes terrain", "vêtement de travail personnalisé", "t-shirts, polos et sweats avec logo"),
    S("Clubs sportifs et associations", "textile club sportif", "t-shirts et sweats personnalisés"),
    S("Commerces, restaurants et hôtels", "tenue personnalisée", "polos et tabliers marqués"),
    S("Événements, salons et festivals", "t-shirt événement", "textiles personnalisés pour équipes et bénévoles"),
  ],
  "panneaux-baches-vinyles-toiles": [
    S("BTP et artisans du bâtiment", "panneau chantier", "panneaux de chantier et bâches"),
    S("Commerces et magasins", "signalétique magasin", "panneaux, adhésifs et vitrophanie"),
    S("Industrie, transport et logistique", "signalétique industrielle", "panneaux de signalisation et adhésifs"),
    S("Collectivités et associations", "signalétique collectivité", "panneaux d'information et banderoles"),
    S("Agriculture, viticulture et tourisme", "panneau extérieur", "panneaux directionnels et bâches"),
  ],
};

/* -------------------------------------------------------------------------- */
/* Occasions / événements par univers réel                                     */
/* -------------------------------------------------------------------------- */
export const EVENTS_BY_UNIVERSE: Record<string, EventEntry[]> = {
  "impression-papier": [
    E("Portes ouvertes et inaugurations", "portes ouvertes", "flyers, invitations et affiches"),
    E("Ouverture de magasin ou d'agence", "ouverture magasin", "flyers et cartons d'invitation"),
    E("Lancement de produit ou d'entreprise", "lancement produit", "dépliants, brochures et cartes"),
    E("Salons professionnels et foires", "salon professionnel", "brochures, catalogues et cartes de visite"),
    E("Promotions, soldes et opérations commerciales", "opération commerciale", "prospectus et flyers"),
    E("Recrutement et communication interne", "recrutement", "affiches et dépliants"),
  ],
  "publicite-exterieure": [
    E("Événements sportifs et tournois", "événement sportif", "bâches, banderoles et calicots"),
    E("Festivals, concerts et fêtes locales", "festival", "banderoles et affichage grand format"),
    E("Chantiers et programmes immobiliers", "chantier", "panneaux de chantier et bâches"),
    E("Inaugurations et portes ouvertes", "inauguration", "banderoles et bâches événementielles"),
    E("Soldes et animations commerciales", "soldes", "bâches promotionnelles et affiches vitrine"),
  ],
  "publicite-interieure": [
    E("Salons professionnels et expositions", "salon professionnel", "roll-ups, totems et comptoirs"),
    E("Séminaires et congrès", "séminaire", "kakémonos et supports d'accueil"),
    E("Ouverture de magasin et animations", "ouverture magasin", "PLV, présentoirs et totems"),
    E("Lancements de produit", "lancement produit", "PLV et supports d'exposition"),
  ],
  "etiquettes-stickers": [
    E("Lancements de gamme et nouveaux produits", "lancement produit", "étiquettes produit et stickers"),
    E("Opérations promotionnelles", "promotion", "stickers promotionnels et étiquettes adhésives"),
    E("Marchés, foires et ventes éphémères", "marché", "étiquettes et autocollants personnalisés"),
  ],
  "emballages-sacs": [
    E("Fêtes de fin d'année et opérations cadeaux", "fêtes de fin d'année", "sacs et emballages personnalisés"),
    E("Ouverture de boutique", "ouverture boutique", "sacs avec logo"),
    E("Salons et distributions", "salon", "sacs publicitaires"),
  ],
  "objets-publicitaires-cadeaux": [
    E("Salons professionnels et foires", "salon professionnel", "goodies et objets publicitaires"),
    E("Cadeaux clients et fin d'année", "cadeau client", "objets publicitaires personnalisés"),
    E("Séminaires et team building", "séminaire", "goodies d'entreprise"),
    E("Événements associatifs et sportifs", "événement associatif", "objets publicitaires avec logo"),
  ],
  "textiles-accessoires": [
    E("Événements sportifs et courses", "course", "t-shirts personnalisés pour participants et bénévoles"),
    E("Salons et opérations terrain", "salon", "polos et t-shirts d'équipe"),
    E("Festivals et événements associatifs", "festival", "textiles personnalisés"),
  ],
  "panneaux-baches-vinyles-toiles": [
    E("Chantiers et projets immobiliers", "chantier", "panneaux de chantier"),
    E("Événements extérieurs et manifestations", "manifestation", "panneaux et bâches"),
    E("Ouverture et travaux de commerce", "travaux commerce", "panneaux d'information et adhésifs vitrine"),
  ],
};

/** Univers réels du catalogue (clé = slug de catégorie racine). */
export const UNIVERSE_SLUGS = Object.keys(SECTORS_BY_UNIVERSE);

const rot = <T,>(arr: T[], seed: number, n: number): T[] => {
  if (!arr.length) return [];
  const out: T[] = [];
  for (let i = 0; i < Math.min(n, arr.length); i++) out.push(arr[(seed + i) % arr.length]);
  return out;
};

/** Puces visibles « Secteurs professionnels concernés » pour un univers réel. */
export function sectorBullets(universe: string, seed: number, n = 6): string[] {
  return rot(SECTORS_BY_UNIVERSE[universe] || [], seed, n).map((s) => `${s.label} : ${s.supports}.`);
}

/** Puces visibles « Occasions et événements » pour un univers réel. */
export function eventBullets(universe: string, seed: number, n = 4): string[] {
  return rot(EVENTS_BY_UNIVERSE[universe] || [], seed, n).map((e) => `${e.label} : ${e.supports}.`);
}

/** Requêtes métier / événement pour un produit d'un univers donné. */
export function sectorEventKeywords(universe: string, productLower: string, seed: number): string[] {
  const out: string[] = [];
  for (const s of rot(SECTORS_BY_UNIVERSE[universe] || [], seed, 4)) {
    out.push(`${productLower} ${s.query}`);
  }
  for (const e of rot(EVENTS_BY_UNIVERSE[universe] || [], seed + 1, 3)) {
    out.push(`${productLower} ${e.query}`);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Déclinaisons locales — ville / département / numéro / région                */
/* -------------------------------------------------------------------------- */
const ALL_SECTORS: SectorEntry[] = Object.values(SECTORS_BY_UNIVERSE).flat();
const ALL_EVENTS: EventEntry[] = Object.values(EVENTS_BY_UNIVERSE).flat();

/** Puces visibles « Professionnels accompagnés » sur une page locale. */
export function geoSectorBullets(place: string, seed: number, n = 8): string[] {
  const seen = new Set<string>();
  const picked: SectorEntry[] = [];
  for (const s of rot(ALL_SECTORS, seed, ALL_SECTORS.length)) {
    if (seen.has(s.label)) continue;
    seen.add(s.label);
    picked.push(s);
    if (picked.length >= n) break;
  }
  return picked.map((s) => `${s.label} à ${place} : ${s.supports}.`);
}

/** Puces visibles « Occasions fréquentes » sur une page locale. */
export function geoEventBullets(place: string, seed: number, n = 5): string[] {
  const seen = new Set<string>();
  const picked: EventEntry[] = [];
  for (const e of rot(ALL_EVENTS, seed + 2, ALL_EVENTS.length)) {
    if (seen.has(e.label)) continue;
    seen.add(e.label);
    picked.push(e);
    if (picked.length >= n) break;
  }
  return picked.map((e) => `${e.label} à ${place} : ${e.supports}.`);
}

/** Variante « dans le département / la région » (sans « à »). */
export function zoneSectorBullets(dans: string, seed: number, n = 8): string[] {
  return geoSectorBullets("", seed, n).map((b) => b.replace(" à  : ", ` ${dans} : `));
}
export function zoneEventBullets(dans: string, seed: number, n = 5): string[] {
  return geoEventBullets("", seed, n).map((b) => b.replace(" à  : ", ` ${dans} : `));
}
