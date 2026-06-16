// Rich, genuinely differentiated data for city & department SEO pages.
// IMPORTANT: J2L Print is an ONLINE printer — never claim a physical shop or
// workshop in any city. Each profile drives distinct copy (local economy,
// audiences, events) so no two pages are name-swapped duplicates.
import type { ProductCard, LinkItem } from "../types";

export interface CityProfile {
  /** one-sentence description of the local economic fabric */
  economy: string;
  /** distinct local clienteles (rendered as bullets) */
  sectors: string[];
  /** sentence about who typically orders + a local context angle */
  audiences: string;
  /** local events / seasonal context (no fake partnership) */
  events: string;
  /** neighbouring city slugs (must be other published city pages) */
  neighbors: string[];
  /** which hero image variant to use (1..3) */
  hero: 1 | 2 | 3;
}

// 16 priority cities — each profile is intentionally specific.
export const CITY_PROFILES: Record<string, CityProfile> = {
  epinal: {
    economy:
      "Préfecture des Vosges, Épinal mêle un centre-ville commerçant dynamique, un tissu d'artisans et une forte tradition autour de l'image et de l'imprimé.",
    sectors: [
      "Commerces et boutiques du centre-ville spinalien",
      "Artisans et TPE du bassin d'Épinal",
      "Associations culturelles, sportives et de quartier",
      "Collectivités et services publics locaux",
      "Acteurs de la culture et de l'événementiel vosgien",
    ],
    audiences:
      "Commerçants, artisans, associations et collectivités d'Épinal commandent en ligne flyers, affiches et PLV pour animer le centre-ville et leurs manifestations.",
    events:
      "Marchés, festivals et temps forts vosgiens rythment l'année : autant d'occasions d'imprimer affiches, banderoles et programmes livrés sur place.",
    neighbors: ["remiremont", "saint-die-des-vosges", "neufchateau", "nancy", "luneville"],
    hero: 1,
  },
  nancy: {
    economy:
      "Capitale historique de la Lorraine, Nancy concentre sièges d'entreprises, professions libérales, recherche, santé et un commerce de centre-ville très actif.",
    sectors: [
      "Entreprises et sièges du Grand Nancy",
      "Professions libérales, cabinets et études",
      "Commerces du centre-ville et de la place Stanislas",
      "Salons, congrès et événements professionnels",
      "Vie étudiante, recherche et associations",
    ],
    audiences:
      "Entreprises, cabinets et organisateurs de salons nancéiens privilégient les cartes de visite, brochures et stands roll-up pour leurs rendez-vous professionnels.",
    events:
      "Congrès au parc des expositions, salons et vie étudiante génèrent une forte demande de supports événementiels et de signalétique.",
    neighbors: ["luneville", "metz", "epinal", "neufchateau", "verdun"],
    hero: 3,
  },
  metz: {
    economy:
      "Chef-lieu de la Moselle et de l'ancienne région, Metz associe administrations, entreprises de services, commerces et une scène événementielle et culturelle dense.",
    sectors: [
      "Entreprises de services et sièges messins",
      "Commerces et enseignes du centre et des galeries",
      "Acteurs de l'événementiel et de la culture",
      "Associations et clubs sportifs",
      "Communication institutionnelle et collectivités",
    ],
    audiences:
      "Entreprises, institutions et organisateurs d'événements messins commandent affiches grand format, kakémonos et supports institutionnels imprimés en ligne.",
    events:
      "Expositions, événements culturels et salons mosellans appellent une signalétique soignée et des PLV livrées rapidement.",
    neighbors: ["thionville", "nancy", "sarreguemines", "verdun", "luneville"],
    hero: 2,
  },
  strasbourg: {
    economy:
      "Métropole européenne, Strasbourg réunit institutions, entreprises internationales, un commerce de centre-ville réputé et un événementiel d'envergure.",
    sectors: [
      "Entreprises et institutions européennes",
      "Commerces et restaurants du centre et de la Petite France",
      "Événementiel, congrès et tourisme d'affaires",
      "Associations et acteurs culturels",
      "Professions libérales et start-ups",
    ],
    audiences:
      "Entreprises et organisateurs strasbourgeois recherchent des supports multilingues soignés : brochures, stands et signalétique pour congrès et salons.",
    events:
      "Marché de Noël, congrès et grands événements internationaux génèrent un fort besoin de supports de communication imprimés.",
    neighbors: ["colmar", "mulhouse", "sarreguemines", "metz"],
    hero: 2,
  },
  colmar: {
    economy:
      "Au cœur du vignoble alsacien, Colmar vit du tourisme, de la viticulture, d'un commerce de centre-ville pittoresque et d'un artisanat de qualité.",
    sectors: [
      "Domaines viticoles et caves",
      "Commerces, hôtels et restaurants touristiques",
      "Artisans et métiers d'art",
      "Associations et offices événementiels",
      "TPE et professions libérales",
    ],
    audiences:
      "Domaines, hôtels et commerces colmariens commandent étiquettes, dépliants touristiques et affiches pour valoriser leurs produits et leur accueil.",
    events:
      "Foire aux vins, marchés de Noël et fêtes viticoles rythment la saison et appellent affiches, étiquettes et signalétique.",
    neighbors: ["mulhouse", "strasbourg", "remiremont", "epinal"],
    hero: 1,
  },
  mulhouse: {
    economy:
      "Ville industrielle et universitaire, Mulhouse réunit industrie, PME, un commerce populaire et de grands musées techniques.",
    sectors: [
      "Industrie, PME et sous-traitance",
      "Commerces et enseignes de proximité",
      "Acteurs culturels et musées",
      "Associations et clubs sportifs",
      "Établissements de formation et étudiants",
    ],
    audiences:
      "Industriels et commerçants mulhousiens commandent catalogues techniques, signalétique d'atelier et supports de prospection imprimés en ligne.",
    events:
      "Salons industriels, événements culturels et animations commerciales soutiennent la demande de PLV et de grand format.",
    neighbors: ["colmar", "strasbourg", "remiremont"],
    hero: 2,
  },
  reims: {
    economy:
      "Capitale du champagne, Reims associe maisons de négoce, tourisme œnologique, entreprises de services et un centre commerçant animé.",
    sectors: [
      "Maisons de champagne et négoce",
      "Hôtellerie, restauration et tourisme",
      "Commerces et enseignes du centre",
      "Entreprises de services et professions libérales",
      "Associations et acteurs de l'événementiel",
    ],
    audiences:
      "Maisons, hôtels et commerces rémois commandent étiquettes premium, coffrets et brochures pour soutenir leur image et leurs ventes.",
    events:
      "Salons œnologiques, événements sportifs et animations urbaines génèrent des besoins en signalétique et supports promotionnels.",
    neighbors: ["troyes", "chaumont", "verdun"],
    hero: 3,
  },
  troyes: {
    economy:
      "Berceau de la maille et des magasins d'usine, Troyes vit du textile, du commerce, d'un patrimoine médiéval et d'un tissu d'artisans.",
    sectors: [
      "Enseignes textiles et magasins d'usine",
      "Commerces du centre médiéval",
      "Artisans et créateurs",
      "Associations et acteurs culturels",
      "TPE et professions libérales",
    ],
    audiences:
      "Enseignes et commerces troyens commandent étiquettes, PLV et affiches pour animer les magasins d'usine et le centre historique.",
    events:
      "Opérations commerciales, braderies et événements patrimoniaux soutiennent la demande de supports promotionnels.",
    neighbors: ["reims", "chaumont", "neufchateau"],
    hero: 1,
  },
  "saint-die-des-vosges": {
    economy:
      "Ville industrielle nichée dans la montagne vosgienne, Saint-Dié-des-Vosges s'appuie sur le bois, l'industrie, le commerce de proximité et une vie associative active.",
    sectors: [
      "Industrie du bois et manufactures",
      "Commerces et services de proximité",
      "Artisans et TPE de la vallée",
      "Associations sportives et culturelles",
      "Collectivités et offices événementiels",
    ],
    audiences:
      "Industriels, commerçants et associations déodatiens commandent catalogues, affiches et banderoles pour leurs activités et manifestations.",
    events:
      "Le Festival International de Géographie et les animations locales appellent des programmes, banderoles et signalétiques dédiés.",
    neighbors: ["epinal", "remiremont", "colmar", "nancy"],
    hero: 1,
  },
  remiremont: {
    economy:
      "Petite ville de caractère au pied des Hautes-Vosges, Remiremont vit du commerce sous arcades, du tourisme de montagne et d'un artisanat local.",
    sectors: [
      "Commerces sous les arcades",
      "Hôtellerie et tourisme de montagne",
      "Artisans et producteurs locaux",
      "Associations et offices de tourisme",
      "TPE et professions libérales",
    ],
    audiences:
      "Commerçants et hébergeurs roménois commandent dépliants touristiques, affiches et menus pour valoriser le centre historique.",
    events:
      "Marchés, fêtes saisonnières et animations de montagne soutiennent la demande d'affiches et de banderoles.",
    neighbors: ["epinal", "saint-die-des-vosges", "mulhouse", "colmar"],
    hero: 1,
  },
  neufchateau: {
    economy:
      "Sous-préfecture rurale de l'ouest vosgien, Neufchâteau s'appuie sur l'industrie, l'artisanat, le commerce de proximité et les activités agricoles.",
    sectors: [
      "PME industrielles et ateliers",
      "Commerces et services ruraux",
      "Artisans et exploitations agricoles",
      "Associations locales",
      "Collectivités du Pays de Neufchâteau",
    ],
    audiences:
      "PME, artisans et commerces néocastriens commandent supports de prospection, catalogues et signalétique adaptés au territoire rural.",
    events:
      "Foires agricoles, marchés et fêtes de village rythment l'année et appellent affiches et banderoles.",
    neighbors: ["epinal", "nancy", "chaumont", "troyes"],
    hero: 3,
  },
  luneville: {
    economy:
      "Ville d'art et d'histoire, Lunéville est réputée pour sa faïence, son château et un commerce de centre-ville porté par l'artisanat d'art.",
    sectors: [
      "Faïenceries et métiers d'art",
      "Commerces et boutiques du centre",
      "Artisans et créateurs",
      "Associations culturelles et patrimoniales",
      "TPE et professions libérales",
    ],
    audiences:
      "Artisans d'art et commerçants lunévillois commandent étiquettes, cartons d'invitation et affiches pour expositions et événements patrimoniaux.",
    events:
      "Expositions au château, salons d'art et fêtes locales appellent cartons, affiches et signalétique soignés.",
    neighbors: ["nancy", "epinal", "saint-die-des-vosges", "sarreguemines"],
    hero: 3,
  },
  thionville: {
    economy:
      "Pôle transfrontalier proche du Luxembourg, Thionville réunit entreprises, travailleurs frontaliers, commerces et une activité de services dynamique.",
    sectors: [
      "Entreprises et services transfrontaliers",
      "Commerces et enseignes du centre",
      "Artisans et TPE du bassin",
      "Associations et clubs sportifs",
      "Professions libérales et frontaliers",
    ],
    audiences:
      "Entreprises et commerces thionvillois commandent cartes de visite, brochures et signalétique pour leur clientèle locale et transfrontalière.",
    events:
      "Animations commerciales et événements transfrontaliers soutiennent la demande de PLV et de supports promotionnels.",
    neighbors: ["metz", "sarreguemines", "verdun", "nancy"],
    hero: 2,
  },
  sarreguemines: {
    economy:
      "Ville faïencière à la frontière allemande, Sarreguemines associe industrie, artisanat, commerce transfrontalier et patrimoine céramique.",
    sectors: [
      "Industrie et artisanat céramique",
      "Commerces et services transfrontaliers",
      "PME et ateliers du bassin",
      "Associations et acteurs culturels",
      "TPE et professions libérales",
    ],
    audiences:
      "Industriels et commerçants sarregueminois commandent catalogues, étiquettes et signalétique bilingues pour leur marché transfrontalier.",
    events:
      "Marchés, fêtes de la faïence et événements transfrontaliers appellent affiches et banderoles dédiées.",
    neighbors: ["metz", "thionville", "strasbourg", "nancy"],
    hero: 2,
  },
  verdun: {
    economy:
      "Ville de mémoire, Verdun vit du tourisme commémoratif, du commerce de proximité, de l'agroalimentaire et d'un tissu associatif fort.",
    sectors: [
      "Tourisme mémoriel et sites historiques",
      "Commerces et services de proximité",
      "Agroalimentaire et producteurs locaux",
      "Associations et collectivités",
      "TPE et professions libérales",
    ],
    audiences:
      "Sites touristiques, commerces et collectivités verdunois commandent dépliants, signalétique et supports commémoratifs imprimés en ligne.",
    events:
      "Commémorations, circuits mémoriels et animations locales appellent dépliants, panneaux et signalétique dédiés.",
    neighbors: ["metz", "nancy", "reims", "thionville"],
    hero: 3,
  },
  chaumont: {
    economy:
      "Capitale du graphisme et de l'affiche, Chaumont associe une scène du design graphique reconnue, des collectivités et un commerce de centre-ville.",
    sectors: [
      "Acteurs du graphisme et de l'affiche",
      "Collectivités et services publics",
      "Commerces et services du centre",
      "Associations culturelles",
      "TPE et professions libérales",
    ],
    audiences:
      "Acteurs culturels, collectivités et commerces chaumontais commandent affiches, catalogues d'exposition et signalétique soignés.",
    events:
      "La Biennale du design graphique et les événements culturels appellent affiches grand format et supports d'exposition.",
    neighbors: ["troyes", "neufchateau", "reims", "epinal"],
    hero: 3,
  },
};

// ── Department data ──
export interface DeptProfile {
  /** description of the department's economic fabric */
  economy: string;
  /** professional sectors served (bullets) */
  sectors: string[];
  /** neighbouring department slugs (must be other published dept pages) */
  neighbors: string[];
}

export const DEPT_PROFILES: Record<string, DeptProfile> = {
  vosges: {
    economy:
      "Les Vosges mêlent industrie du bois et du papier, thermalisme, tourisme de montagne et un dense réseau de commerces et d'artisans.",
    sectors: [
      "Industrie du bois, du papier et du textile",
      "Tourisme de montagne et thermalisme",
      "Commerces et artisans des vallées",
      "Associations sportives et culturelles",
      "Collectivités et offices de tourisme",
    ],
    neighbors: ["meurthe-et-moselle", "haute-saone", "haut-rhin", "haute-marne", "meuse"],
  },
  "meurthe-et-moselle": {
    economy:
      "La Meurthe-et-Moselle s'organise autour de Nancy : services, santé, recherche, industrie et un commerce métropolitain actif.",
    sectors: [
      "Entreprises de services et sièges",
      "Santé, recherche et enseignement",
      "Industrie et sous-traitance",
      "Commerces et professions libérales",
      "Associations et événementiel",
    ],
    neighbors: ["vosges", "moselle", "meuse", "bas-rhin"],
  },
  moselle: {
    economy:
      "La Moselle, frontalière du Luxembourg et de l'Allemagne, conjugue industrie, services transfrontaliers, commerce et tourisme.",
    sectors: [
      "Industrie et logistique transfrontalière",
      "Services et frontaliers du Luxembourg",
      "Commerces et enseignes",
      "Tourisme et culture",
      "Collectivités et institutions",
    ],
    neighbors: ["meurthe-et-moselle", "bas-rhin", "meuse"],
  },
  "bas-rhin": {
    economy:
      "Le Bas-Rhin, porté par Strasbourg, réunit institutions européennes, industrie, viticulture et un commerce de centre-ville réputé.",
    sectors: [
      "Institutions et entreprises internationales",
      "Industrie et start-ups",
      "Viticulture et tourisme",
      "Commerces et restauration",
      "Associations et événementiel",
    ],
    neighbors: ["moselle", "haut-rhin", "meurthe-et-moselle"],
  },
  "haut-rhin": {
    economy:
      "Le Haut-Rhin associe industrie, viticulture alsacienne, tourisme et un réseau dense de commerces et d'artisans.",
    sectors: [
      "Industrie et PME",
      "Domaines viticoles et tourisme",
      "Commerces et métiers d'art",
      "Associations et musées",
      "Professions libérales",
    ],
    neighbors: ["bas-rhin", "vosges", "haute-saone"],
  },
  "haute-saone": {
    economy:
      "La Haute-Saône, rurale et industrielle, s'appuie sur la métallurgie, l'agriculture, l'artisanat et un commerce de proximité.",
    sectors: [
      "Industrie et métallurgie",
      "Agriculture et agroalimentaire",
      "Artisans et TPE",
      "Commerces ruraux",
      "Associations et collectivités",
    ],
    neighbors: ["vosges", "haut-rhin", "haute-marne"],
  },
  meuse: {
    economy:
      "La Meuse, territoire rural et de mémoire, conjugue agriculture, tourisme commémoratif, artisanat et commerce de proximité.",
    sectors: [
      "Agriculture et agroalimentaire",
      "Tourisme mémoriel",
      "Artisans et TPE",
      "Commerces de proximité",
      "Collectivités et associations",
    ],
    neighbors: ["meurthe-et-moselle", "moselle", "marne", "vosges"],
  },
  marne: {
    economy:
      "La Marne, terre de champagne, réunit négoce viticole, agro-industrie, tourisme et un commerce dynamique.",
    sectors: [
      "Maisons de champagne et négoce",
      "Agro-industrie et coopératives",
      "Tourisme et hôtellerie",
      "Commerces et services",
      "Associations et événementiel",
    ],
    neighbors: ["meuse", "aube", "haute-marne"],
  },
  aube: {
    economy:
      "L'Aube vit du textile et des magasins d'usine, de l'agriculture champenoise, du tourisme et d'un commerce de centre-ville actif.",
    sectors: [
      "Textile et magasins d'usine",
      "Agriculture et viticulture",
      "Tourisme et patrimoine",
      "Commerces et artisans",
      "Associations et collectivités",
    ],
    neighbors: ["marne", "haute-marne"],
  },
  "haute-marne": {
    economy:
      "La Haute-Marne, rurale et industrielle, s'appuie sur la métallurgie, la coutellerie, l'agriculture et un tissu d'artisans.",
    sectors: [
      "Métallurgie et coutellerie",
      "Agriculture et forêt",
      "Artisans et TPE",
      "Commerces de proximité",
      "Associations et collectivités",
    ],
    neighbors: ["vosges", "haute-saone", "marne", "aube", "meuse"],
  },
};

// ── External official resources (real, useful, never competitors) ──
export const CITY_OFFICIAL: Record<string, { label: string; url: string }> = {
  epinal: { label: "Ville d'Épinal (site officiel)", url: "https://www.epinal.fr" },
  nancy: { label: "Ville de Nancy (site officiel)", url: "https://www.nancy.fr" },
  metz: { label: "Ville de Metz (site officiel)", url: "https://metz.fr" },
  strasbourg: { label: "Ville de Strasbourg (site officiel)", url: "https://www.strasbourg.eu" },
  colmar: { label: "Ville de Colmar (site officiel)", url: "https://www.colmar.fr" },
  mulhouse: { label: "Ville de Mulhouse (site officiel)", url: "https://www.mulhouse.fr" },
  reims: { label: "Ville de Reims (site officiel)", url: "https://www.reims.fr" },
  troyes: { label: "Ville de Troyes (site officiel)", url: "https://www.troyes.fr" },
  "saint-die-des-vosges": { label: "Ville de Saint-Dié-des-Vosges (site officiel)", url: "https://www.saint-die.eu" },
  remiremont: { label: "Ville de Remiremont (site officiel)", url: "https://www.remiremont.fr" },
  neufchateau: { label: "Ville de Neufchâteau (site officiel)", url: "https://www.neufchateau.fr" },
  luneville: { label: "Ville de Lunéville (site officiel)", url: "https://www.luneville.fr" },
  thionville: { label: "Ville de Thionville (site officiel)", url: "https://www.thionville.fr" },
  sarreguemines: { label: "Ville de Sarreguemines (site officiel)", url: "https://www.sarreguemines.eu" },
  verdun: { label: "Grand Verdun (site officiel)", url: "https://www.grandverdun.fr" },
  chaumont: { label: "Ville de Chaumont (site officiel)", url: "https://www.chaumont.fr" },
};

export const DEPT_OFFICIAL: Record<string, { label: string; url: string }> = {
  vosges: { label: "Conseil départemental des Vosges", url: "https://www.vosges.fr" },
  "meurthe-et-moselle": { label: "Conseil départemental de Meurthe-et-Moselle", url: "https://www.meurthe-et-moselle.fr" },
  moselle: { label: "Conseil départemental de la Moselle", url: "https://www.moselle.fr" },
  "bas-rhin": { label: "Collectivité européenne d'Alsace", url: "https://www.alsace.eu" },
  "haut-rhin": { label: "Collectivité européenne d'Alsace", url: "https://www.alsace.eu" },
  "haute-saone": { label: "Conseil départemental de la Haute-Saône", url: "https://www.haute-saone.fr" },
  meuse: { label: "Conseil départemental de la Meuse", url: "https://www.meuse.fr" },
  marne: { label: "Conseil départemental de la Marne", url: "https://www.marne.fr" },
  aube: { label: "Conseil départemental de l'Aube", url: "https://www.aube.fr" },
  "haute-marne": { label: "Conseil départemental de la Haute-Marne", url: "https://www.haute-marne.fr" },
};

export const CCI_GRAND_EST: LinkItem = {
  label: "CCI Grand Est (ressources entreprises)",
  path: "https://www.grandest.cci.fr",
  external: true,
};

// ── Product cards (link to existing catalog categories — never the API) ──
// Shared catalogue of the most-requested supports. The H3 set required by the
// brief; cards link only to existing /categorie/* pages.
export const PRODUCT_CARDS: ProductCard[] = [
  { label: "Flyers et dépliants", path: "/categorie/impression-papier", icon: "FileText", description: "Prospection et boîtage, du tirage unitaire aux grandes séries." },
  { label: "Cartes de visite", path: "/categorie/impression-papier", icon: "CreditCard", description: "Papiers et finitions premium pour une première impression soignée." },
  { label: "Affiches et panneaux", path: "/categorie/panneaux-baches-vinyles-toiles", icon: "Image", description: "De l'affiche A0 au panneau rigide pour vitrines et chantiers." },
  { label: "Bâches et banderoles", path: "/categorie/publicite-exterieure", icon: "Flag", description: "Grand format résistant pour façades, événements et extérieurs." },
  { label: "Objets publicitaires", path: "/categorie/objets-publicitaires-cadeaux", icon: "Gift", description: "Goodies et cadeaux d'affaires personnalisés à votre image." },
  { label: "Textiles personnalisés", path: "/categorie/textiles-accessoires", icon: "Shirt", description: "T-shirts, polos et accessoires marqués pour équipes et événements." },
  { label: "PLV et supports événementiels", path: "/categorie/publicite-interieure", icon: "LayoutPanelTop", description: "Roll-ups, totems et comptoirs pour salons et points de vente." },
  { label: "Stickers et autocollants", path: "/categorie/etiquettes-stickers", icon: "Sticker", description: "Étiquettes et adhésifs sur mesure pour produits et vitrines." },
];

// All categories the brief requires linking to, with varied natural anchors.
export const CATEGORY_LINKS_VARIED: { anchor: string; path: string }[] = [
  { anchor: "découvrir nos flyers personnalisés", path: "/categorie/impression-papier" },
  { anchor: "voir les panneaux et bâches", path: "/categorie/panneaux-baches-vinyles-toiles" },
  { anchor: "consulter la publicité extérieure", path: "/categorie/publicite-exterieure" },
  { anchor: "explorer la publicité intérieure et la PLV", path: "/categorie/publicite-interieure" },
  { anchor: "commander des étiquettes et stickers", path: "/categorie/etiquettes-stickers" },
  { anchor: "voir les emballages et sacs", path: "/categorie/emballages-sacs" },
  { anchor: "offrir des objets publicitaires", path: "/categorie/objets-publicitaires-cadeaux" },
  { anchor: "personnaliser vos textiles", path: "/categorie/textiles-accessoires" },
];

export const SERVICE_LINKS_VARIED: { anchor: string; path: string }[] = [
  { anchor: "nos solutions d'impression numérique", path: "/impression-numerique" },
  { anchor: "voir les solutions grand format", path: "/grand-format" },
  { anchor: "consulter les supports publicitaires", path: "/supports-publicitaires" },
  { anchor: "découvrir la personnalisation", path: "/personnalisation" },
];

// NOTE: the old fixed hero set (HERO_CITY_IMAGES / HERO_DEPT_IMAGES / deptHero)
// has been removed. Hero visuals are now assigned from the 16-image bank in
// src/seo/content/hero-bank.ts (archetype + seed + neighbour avoidance).


// ── J2L ecosystem (external sites of the group) ──
// Rendered as a discreet internal-link group (renderer adds target/rel for
// external links). Never call these "backlinks": specialised group sites.
import type { LinkItem as _LinkItemEco } from "../types";
export const J2L_ECOSYSTEM: _LinkItemEco[] = [
  { label: "J2L Publicité — objets publicitaires, communication et services personnalisés", path: "https://www.j2lpublicite.fr", external: true },
  { label: "J2L Textiles — vêtements professionnels et textiles personnalisés", path: "https://www.j2ltextiles.fr", external: true },
  { label: "PizzPub — boîtes à pizza personnalisées pour événements et communication locale", path: "https://www.pizzpub.fr", external: true },
  { label: "BaguettPub — sacs à pains publicitaires personnalisés", path: "https://www.baguettpub.fr", external: true },
];
