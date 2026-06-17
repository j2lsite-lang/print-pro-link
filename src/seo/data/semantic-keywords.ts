/**
 * Complete semantic map for J2L Print — categories + product families.
 *
 * Goal (supplier SEO brief): give every page its own lexical universe, a
 * primary keyword, secondary expressions, long-tail queries, real usages,
 * relevant professional sectors, materials, formats, finitions, commercial
 * intents, client questions and internal anchors — WITHOUT keyword stuffing.
 *
 * This file is pure data + small deterministic helpers. It NEVER touches the
 * catalog API, prices, SKUs, the configurator, the cart or quotes. It only
 * feeds the editorial SEO content (titles, intros, sections, FAQ, JSON-LD).
 *
 * Distribution rule: never inject the whole list into a single page. The
 * content builders pick a seeded, page-specific subset so two pages of the
 * same family stay distinct (anti-duplication).
 */

export interface SemanticEntry {
  /** single, very specific main keyword */
  primaryKeyword: string;
  /** 8 to 20 relevant secondary expressions */
  secondary: string[];
  /** equivalent terms (already used by the search engine) */
  synonyms: string[];
  /** long-tail / intent queries */
  longTail: string[];
  /** concrete usages (rendered as bullets) */
  usages: string[];
  /** relevant professional sectors only */
  sectors: string[];
  /** real materials / supports */
  materials: string[];
  /** real formats */
  formats: string[];
  /** real finitions */
  finitions: string[];
  /** commercial intent vocabulary used naturally in copy */
  commercialIntents: string[];
  /** FAQ pool — a seeded subset is shown per page */
  faq: { q: string; a: string }[];
  /** complementary universes (category slugs, always valid links) */
  complementary: string[];
  /** descriptive internal anchors */
  anchors: string[];
}

/** Shared, reusable vocabulary pools (referenced, not dumped, per page). */
export const COMMERCIAL_VOCAB = [
  "personnaliser", "configurer", "commander", "prix", "devis gratuit",
  "impression en ligne", "fabrication", "impression professionnelle",
  "impression personnalisée", "avec logo", "petite quantité", "grande quantité",
  "sur mesure", "livraison", "fichier d'impression", "BAT", "recto verso",
  "finition", "support", "format",
];

export const SECTORS_POOL = [
  "commerces", "artisans", "restaurants", "hôtels", "collectivités",
  "associations", "événements", "salons professionnels", "agences immobilières",
  "automobile", "santé", "écoles", "industrie", "logistique", "tourisme",
  "sport", "entreprises", "professions libérales",
];

/* -------------------------------------------------------------------------- */
/* Deterministic helpers — seeded, page-specific selection (anti-duplication) */
/* -------------------------------------------------------------------------- */

/** Stable 32-bit hash (FNV-1a) of any string — used as a per-page seed. */
export function seedFrom(input: string): number {
  let h = 2166136261;
  const s = input || "";
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick `n` items starting at a seeded offset (rotates through the list). */
export function pickN<T>(arr: T[], seed: number, n: number): T[] {
  if (!arr.length) return [];
  if (arr.length <= n) return arr.slice();
  const out: T[] = [];
  const start = seed % arr.length;
  for (let i = 0; i < n; i++) out.push(arr[(start + i) % arr.length]);
  return out;
}

/** Pick a single seeded item. */
export function pickOne<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/* -------------------------------------------------------------------------- */
/* 8 categories — one lexical universe each                                    */
/* -------------------------------------------------------------------------- */

export const CATEGORY_KEYWORDS: Record<string, SemanticEntry> = {
  "impression-papier": {
    primaryKeyword: "impression papier professionnelle",
    secondary: [
      "imprimerie en ligne", "supports imprimés", "flyers personnalisés",
      "cartes de visite", "brochures", "dépliants", "affiches",
      "papeterie commerciale", "impression offset", "impression numérique",
      "recto verso", "pelliculage", "vernis sélectif", "grammage papier",
      "papier recyclé", "petites quantités", "grande série",
    ],
    synonyms: ["imprimés", "documents imprimés", "tirage papier"],
    longTail: [
      "imprimer des flyers en petite quantité",
      "impression papier professionnelle en ligne",
      "carte de visite avec pelliculage soft touch",
      "brochure dos carré collé sur mesure",
    ],
    usages: [
      "Prospection commerciale et boîtage",
      "Supports d'accueil et points de vente",
      "Documentation produit et présentations",
      "Événements, salons et lancements",
    ],
    sectors: ["commerces", "artisans", "associations", "professions libérales", "entreprises"],
    materials: ["papier couché", "papier offset", "papier recyclé", "papier création"],
    formats: ["A7", "A6", "A5", "A4", "A3", "carré", "format DL"],
    finitions: ["pelliculage mat", "pelliculage brillant", "vernis sélectif", "coins arrondis", "dorure à chaud"],
    commercialIntents: ["devis gratuit", "petite quantité", "grande quantité", "recto verso", "BAT"],
    faq: [
      { q: "Quel grammage choisir pour des flyers ?", a: "Pour une distribution, un papier 135 à 170 g/m² offre un bon équilibre coût/tenue. Pour un document premium, optez pour 250 à 350 g/m²." },
      { q: "Puis-je commander une petite quantité ?", a: "Oui, de nombreux produits papier sont disponibles dès de faibles quantités, le prix unitaire diminuant à mesure que le tirage augmente." },
      { q: "Le fichier doit-il intégrer des fonds perdus ?", a: "Oui, prévoyez 3 mm de fonds perdus et exportez en PDF CMJN pour un rendu conforme à l'impression." },
      { q: "Quelle différence entre offset et numérique ?", a: "Le numérique est idéal pour les petites et moyennes séries (mise en route rapide) ; l'offset devient avantageux sur les grands tirages." },
      { q: "Peut-on imprimer en recto verso ?", a: "Oui, la plupart des supports papier s'impriment en recto seul ou recto verso selon votre maquette." },
      { q: "Mes fichiers sont-ils vérifiés avant impression ?", a: "Oui, un contrôle des fichiers PDF (résolution, fonds perdus, mode colorimétrique) est réalisé avant chaque production." },
      { q: "Proposez-vous des papiers recyclés ?", a: "Oui, plusieurs supports sont disponibles en papier recyclé ou certifié pour une démarche plus responsable." },
      { q: "Comment obtenir un devis ?", a: "Configurez votre produit en ligne pour un prix immédiat, ou décrivez votre besoin via le formulaire de devis gratuit." },
    ],
    complementary: ["objets-publicitaires-cadeaux", "etiquettes-stickers", "emballages-sacs"],
    anchors: ["impression papier professionnelle", "flyers et dépliants", "cartes de visite premium", "brochures et catalogues"],
  },

  "publicite-exterieure": {
    primaryKeyword: "publicité extérieure grand format",
    secondary: [
      "bâche publicitaire", "banderole extérieure", "panneau signalétique",
      "kakémono extérieur", "drapeau publicitaire", "adhésif vitrine",
      "signalétique de façade", "affichage extérieur", "œillets renforcés",
      "encres résistantes UV", "panneau de chantier", "enseigne extérieure",
    ],
    synonyms: ["affichage urbain", "communication extérieure", "PLV extérieure"],
    longTail: [
      "bâche publicitaire grand format résistante aux intempéries",
      "panneau de chantier personnalisé extérieur",
      "drapeau publicitaire pour événement en extérieur",
    ],
    usages: [
      "Façades de commerce et devantures",
      "Chantiers et panneaux d'information",
      "Événements et manifestations en extérieur",
      "Signalétique directionnelle",
    ],
    sectors: ["commerces", "événements", "industrie", "agences immobilières", "collectivités"],
    materials: ["bâche PVC", "panneau Dibond", "panneau Akilux", "vinyle adhésif"],
    formats: ["formats sur mesure", "grand format", "très grand format"],
    finitions: ["œillets", "ourlets renforcés", "fourreaux", "micro-perforation"],
    commercialIntents: ["sur mesure", "devis gratuit", "livraison", "fabrication"],
    faq: [
      { q: "Les bâches résistent-elles à la pluie ?", a: "Oui, le PVC et les encres utilisées sont conçus pour un usage extérieur prolongé, sous la pluie comme au soleil." },
      { q: "Comment fixer un panneau ou une bâche ?", a: "Les bâches sont livrées avec œillets pour tendeurs ou colliers ; les panneaux rigides se vissent ou se posent sur structure." },
      { q: "Quelle taille de texte pour une lecture à distance ?", a: "Adaptez la taille des caractères au recul de lecture : plus le support est vu de loin, plus le titre doit être grand et contrasté." },
      { q: "Peut-on commander un format sur mesure ?", a: "Oui, indiquez vos dimensions exactes lors de la configuration ou demandez un devis personnalisé." },
      { q: "Quel support pour un usage longue durée ?", a: "Le Dibond (aluminium composite) est la référence durable ; l'Akilux est économique pour un usage temporaire." },
      { q: "Les bâches conviennent-elles aux zones ventées ?", a: "Pour les zones très ventées, des bâches micro-perforées laissent passer l'air et limitent la prise au vent." },
    ],
    complementary: ["publicite-interieure", "panneaux-baches-vinyles-toiles", "etiquettes-stickers"],
    anchors: ["bâches et banderoles", "panneaux extérieurs", "signalétique de façade", "drapeaux publicitaires"],
  },

  "publicite-interieure": {
    primaryKeyword: "publicité intérieure et PLV",
    secondary: [
      "roll-up personnalisé", "kakémono intérieur", "affiche point de vente",
      "présentoir PLV", "stop-rayon", "totem d'accueil", "panneau léger",
      "support de salon", "enrouleur publicitaire", "affichage intérieur",
      "PLV carton", "communication en magasin",
    ],
    synonyms: ["PLV", "publicité sur lieu de vente", "merchandising visuel"],
    longTail: [
      "roll-up personnalisé pour stand de salon",
      "présentoir PLV carton pour point de vente",
      "affiche intérieure haute définition sur mesure",
    ],
    usages: [
      "Stands de salon et halls d'accueil",
      "Animation de point de vente",
      "Conférences et séminaires",
      "Vitrines et espaces de réception",
    ],
    sectors: ["commerces", "salons professionnels", "entreprises", "hôtels", "événements"],
    materials: ["toile polyester", "carton PLV", "papier couché", "structure aluminium"],
    formats: ["85x200 cm", "100x200 cm", "formats stand", "A1", "A0"],
    finitions: ["enrouleur avec housse", "structure réutilisable", "montage sans outil"],
    commercialIntents: ["réutilisable", "montage rapide", "devis gratuit", "personnalisée"],
    faq: [
      { q: "Un roll-up est-il réutilisable ?", a: "Oui, l'enrouleur se déploie et se range en quelques secondes ; seule la toile imprimée peut éventuellement être remplacée." },
      { q: "Quelle résolution pour une affiche intérieure ?", a: "Visez 150 dpi à taille réelle pour un rendu net en lecture rapprochée." },
      { q: "Le roll-up est-il livré avec un sac de transport ?", a: "La plupart des modèles sont fournis avec une housse de transport pour faciliter les déplacements." },
      { q: "Peut-on monter ces supports sans outil ?", a: "Oui, la majorité des supports intérieurs se montent sans outil, idéal pour les équipes itinérantes." },
      { q: "Quel support pour un salon professionnel ?", a: "Le roll-up et le totem sont parfaits pour un stand : visibles, légers et faciles à transporter." },
      { q: "Comment obtenir un devis pour un stand complet ?", a: "Décrivez votre besoin dans le formulaire de devis : nous proposons un ensemble cohérent de supports." },
    ],
    complementary: ["publicite-exterieure", "impression-papier", "objets-publicitaires-cadeaux"],
    anchors: ["roll-up et enrouleurs", "affiches intérieures", "présentoirs PLV", "supports de salon"],
  },

  "etiquettes-stickers": {
    primaryKeyword: "étiquettes et stickers personnalisés",
    secondary: [
      "autocollants personnalisés", "étiquettes adhésives", "stickers découpés",
      "vinyle adhésif", "étiquettes produit", "stickers logo", "rouleau d'étiquettes",
      "découpe à la forme", "adhésif repositionnable", "étiquette alimentaire",
      "sticker vitrine", "marquage adhésif",
    ],
    synonyms: ["autocollant", "sticker", "adhésif", "label"],
    longTail: [
      "étiquettes adhésives personnalisées en rouleau",
      "stickers découpés à la forme de mon logo",
      "autocollants vinyle résistants à l'eau",
    ],
    usages: [
      "Étiquetage de produits et emballages",
      "Stickers promotionnels et goodies",
      "Marquage et signalétique adhésive",
      "Habillage de vitrine",
    ],
    sectors: ["commerces", "artisans", "industrie", "restaurants", "événements"],
    materials: ["papier adhésif", "vinyle blanc", "vinyle transparent", "polypropylène"],
    formats: ["rond", "carré", "rectangulaire", "découpe à la forme", "planche", "rouleau"],
    finitions: ["adhésif permanent", "adhésif repositionnable", "pelliculage de protection", "vernis"],
    commercialIntents: ["sur mesure", "petite quantité", "grande quantité", "avec logo"],
    faq: [
      { q: "Les stickers résistent-ils à l'eau ?", a: "Les stickers en vinyle sont résistants à l'eau et adaptés à l'extérieur ; les étiquettes papier conviennent à un usage intérieur." },
      { q: "Peut-on découper à la forme de mon logo ?", a: "Oui, la découpe à la forme suit le contour de votre visuel pour un rendu sur mesure." },
      { q: "Existe-t-il des étiquettes en rouleau ?", a: "Oui, le format rouleau facilite la pose en série, notamment pour l'étiquetage produit." },
      { q: "Quel adhésif choisir ?", a: "Un adhésif permanent convient au marquage durable ; un adhésif repositionnable facilite la pose temporaire sur vitrine." },
      { q: "Les étiquettes conviennent-elles au contact alimentaire ?", a: "Pour l'humidité ou un usage proche de l'alimentaire, le vinyle reste le plus fiable selon le support." },
      { q: "Peut-on commander de petites quantités ?", a: "Oui, les quantités sont modulables avec un tarif dégressif selon le volume." },
    ],
    complementary: ["emballages-sacs", "impression-papier", "objets-publicitaires-cadeaux"],
    anchors: ["étiquettes adhésives", "stickers découpés", "autocollants vinyle", "marquage produit"],
  },

  "emballages-sacs": {
    primaryKeyword: "emballages et sacs personnalisés",
    secondary: [
      "sac papier personnalisé", "sac kraft logo", "boîte personnalisée",
      "emballage à votre marque", "sac réutilisable", "coffret cadeau",
      "emballage vente à emporter", "papier de soie", "sac boutique",
      "packaging sur mesure", "tote bag", "emballage écologique",
    ],
    synonyms: ["packaging", "contenant", "sac", "emballage"],
    longTail: [
      "sac papier kraft personnalisé pour boutique",
      "boîte d'emballage à votre logo sur mesure",
      "emballage vente à emporter personnalisé restaurant",
    ],
    usages: [
      "Remise produit en boutique",
      "Vente à emporter et livraison",
      "Coffrets et emballages cadeaux",
      "Événements et opérations promotionnelles",
    ],
    sectors: ["commerces", "restaurants", "hôtels", "artisans", "tourisme"],
    materials: ["papier kraft", "papier couché", "carton", "non-tissé", "matières recyclées"],
    formats: ["petit", "moyen", "grand", "format sur mesure"],
    finitions: ["poignées torsadées", "poignées plates", "pelliculage mat", "impression recto/verso"],
    commercialIntents: ["à votre marque", "sur mesure", "devis gratuit", "grande quantité"],
    faq: [
      { q: "Quel sac choisir pour une boutique ?", a: "Un sac papier kraft à poignées torsadées offre une bonne tenue ; le pelliculage mat apporte une finition premium." },
      { q: "Peut-on imprimer sur les deux faces ?", a: "Oui, l'impression recto/verso permet d'exploiter toute la surface du sac ou de la boîte." },
      { q: "Proposez-vous des emballages écologiques ?", a: "Oui, des matières recyclées et recyclables sont disponibles pour une démarche plus responsable." },
      { q: "Quel emballage pour la vente à emporter ?", a: "Des sacs et boîtes adaptés au transport alimentaire valorisent votre marque tout en restant pratiques." },
      { q: "À partir de quelle quantité commander ?", a: "Les emballages se commandent généralement par lots, avec un coût unitaire dégressif selon le volume." },
      { q: "Comment obtenir un devis personnalisé ?", a: "Décrivez votre besoin (dimensions, matière, quantité) dans le formulaire de devis gratuit." },
    ],
    complementary: ["etiquettes-stickers", "impression-papier", "objets-publicitaires-cadeaux"],
    anchors: ["sacs papier personnalisés", "boîtes et coffrets", "emballages à votre marque", "packaging sur mesure"],
  },

  "objets-publicitaires-cadeaux": {
    primaryKeyword: "objets publicitaires personnalisés",
    secondary: [
      "cadeaux d'entreprise", "goodies personnalisés", "objets promotionnels",
      "mug personnalisé", "gourde personnalisée", "tote bag publicitaire",
      "stylo personnalisé", "carnet personnalisé", "cadeaux d'affaires",
      "objet avec logo", "goodies de salon", "cadeau de fin d'année",
    ],
    synonyms: ["goodies", "objets promotionnels", "cadeaux publicitaires"],
    longTail: [
      "cadeaux d'entreprise personnalisés avec logo",
      "goodies de salon personnalisés en petite quantité",
      "gourde réutilisable personnalisée éco-responsable",
    ],
    usages: [
      "Cadeaux d'affaires et fidélisation",
      "Goodies de salon et d'événement",
      "Merchandising et cadeaux de fin d'année",
      "Démarches éco-responsables",
    ],
    sectors: ["entreprises", "événements", "salons professionnels", "sport", "associations"],
    materials: ["céramique", "inox", "coton", "tritan / rPET", "métal"],
    formats: ["selon l'objet", "modèles variés"],
    finitions: ["marquage quadri", "marquage monochrome", "gravure", "coffret cadeau"],
    commercialIntents: ["avec logo", "petite quantité", "grande quantité", "sur mesure"],
    faq: [
      { q: "À partir de quelle quantité commander ?", a: "Les objets publicitaires se commandent généralement par lots ; le coût unitaire diminue fortement avec le volume." },
      { q: "Le marquage du logo est-il en couleur ?", a: "Selon l'objet et la technique de marquage, l'impression peut être monochrome ou en quadrichromie." },
      { q: "Quel objet pour un salon professionnel ?", a: "Privilégiez un objet utile et durable (mug, gourde, tote bag) : il reste sous les yeux du destinataire longtemps." },
      { q: "Peut-on recevoir un échantillon ?", a: "Selon les modèles, un échantillon ou un BAT peut être réalisé avant le lancement de la production." },
      { q: "Proposez-vous des objets éco-responsables ?", a: "Oui, des objets réutilisables et en matières recyclées sont disponibles pour une communication plus durable." },
      { q: "Comment obtenir un devis goodies ?", a: "Décrivez votre projet (objet, quantité, marquage) dans le formulaire de devis gratuit." },
    ],
    complementary: ["textiles-accessoires", "emballages-sacs", "impression-papier"],
    anchors: ["mugs et gourdes", "tote bags publicitaires", "cadeaux d'entreprise", "goodies de salon"],
  },

  "textiles-accessoires": {
    primaryKeyword: "textiles personnalisés pour entreprise",
    secondary: [
      "t-shirt personnalisé", "polo personnalisé", "sweat personnalisé",
      "veste de travail", "casquette personnalisée", "vêtement de travail",
      "textile événementiel", "marquage textile", "sérigraphie textile",
      "broderie logo", "transfert textile", "tenue d'équipe",
    ],
    synonyms: ["vêtement personnalisé", "tee-shirt", "habillement", "textile"],
    longTail: [
      "t-shirt personnalisé avec logo pour entreprise",
      "polo brodé pour équipe d'accueil",
      "sweat personnalisé pour événement sportif",
    ],
    usages: [
      "Uniformes et tenues d'équipe",
      "Événements sportifs et associatifs",
      "Merchandising et boutiques",
      "Salons et opérations terrain",
    ],
    sectors: ["entreprises", "sport", "événements", "associations", "artisans"],
    materials: ["coton", "coton bio", "polyester technique", "coton peigné"],
    formats: ["XS à 5XL", "coupe homme", "coupe femme", "coupe enfant"],
    finitions: ["sérigraphie", "broderie", "flocage", "impression numérique DTG"],
    commercialIntents: ["avec logo", "sur mesure", "petite quantité", "grande quantité"],
    faq: [
      { q: "Broderie ou impression ?", a: "La broderie est idéale pour les logos sur polos et casquettes ; l'impression convient mieux aux visuels larges et détaillés sur t-shirts." },
      { q: "Les tailles sont-elles modulables dans une commande ?", a: "Oui, vous pouvez généralement répartir les tailles au sein d'une même commande selon vos besoins." },
      { q: "Quelle technique pour une grande série ?", a: "La sérigraphie offre le meilleur rapport qualité/prix sur les grandes quantités d'un même visuel." },
      { q: "Le marquage résiste-t-il au lavage ?", a: "Oui, les marquages résistent à des lavages répétés ; la broderie est la technique la plus durable." },
      { q: "Peut-on commander en petite quantité ?", a: "Oui, l'impression numérique DTG permet des petites séries et des visuels complexes." },
      { q: "Réalisez-vous un échantillon avant production ?", a: "Un BAT textile peut être réalisé avant le lancement de votre commande." },
    ],
    complementary: ["objets-publicitaires-cadeaux", "impression-papier", "publicite-interieure"],
    anchors: ["t-shirts personnalisés", "polos brodés", "sweats et vestes", "casquettes et accessoires"],
  },

  "panneaux-baches-vinyles-toiles": {
    primaryKeyword: "panneaux, bâches et vinyles grand format",
    secondary: [
      "panneau rigide", "bâche grand format", "vinyle adhésif", "toile tendue",
      "panneau Dibond", "panneau Akilux", "adhésif vitrine", "adhésif véhicule",
      "toile sur châssis", "signalétique rigide", "impression grand format",
      "covering véhicule",
    ],
    synonyms: ["supports rigides", "grand format", "signalétique"],
    longTail: [
      "panneau Dibond personnalisé pour signalétique durable",
      "bâche grand format tendue pour façade",
      "adhésif vitrine personnalisé sur mesure",
    ],
    usages: [
      "Signalétique durable et enseignes",
      "Grands visuels de façade",
      "Habillage de vitrine et de véhicule",
      "Décoration murale et toiles",
    ],
    sectors: ["commerces", "industrie", "automobile", "agences immobilières", "collectivités"],
    materials: ["Dibond", "Akilux", "PVC", "vinyle adhésif", "toile polyester"],
    formats: ["A4", "A2", "A0", "grand format", "format sur mesure"],
    finitions: ["perçage de fixation", "angles arrondis", "pelliculage anti-UV", "châssis bois"],
    commercialIntents: ["sur mesure", "devis gratuit", "fabrication", "livraison"],
    faq: [
      { q: "Quelle différence entre Dibond et Akilux ?", a: "Le Dibond est un panneau aluminium rigide et durable, idéal pour une signalétique pérenne ; l'Akilux, alvéolaire et plus léger, convient aux usages temporaires." },
      { q: "Le vinyle s'enlève-t-il sans trace ?", a: "Les adhésifs monomères s'enlèvent facilement pour une pose courte ; un vinyle coulé est plus adapté à une pose longue durée." },
      { q: "Peut-on imprimer un panneau recto-verso ?", a: "Oui, sur Dibond et Forex notamment, idéal pour les panneaux suspendus visibles des deux côtés." },
      { q: "Quel support pour l'extérieur ?", a: "Privilégiez des matières et encres résistantes aux UV ; le Dibond et la bâche PVC sont adaptés à un usage extérieur prolongé." },
      { q: "Proposez-vous le covering de véhicule ?", a: "Le vinyle adhésif permet l'habillage partiel ou total de véhicule à partir de votre fichier vectoriel." },
      { q: "Comment obtenir un devis grand format ?", a: "Indiquez vos dimensions et le support souhaité dans le formulaire de devis gratuit." },
    ],
    complementary: ["publicite-exterieure", "publicite-interieure", "etiquettes-stickers"],
    anchors: ["panneaux rigides", "bâches grand format", "adhésifs vinyle", "toiles décoratives"],
  },
};

export const CATEGORY_KEYWORD_SLUGS = Object.keys(CATEGORY_KEYWORDS);

/* -------------------------------------------------------------------------- */
/* Product families — one lexical universe each (drives 970 product pages)     */
/* -------------------------------------------------------------------------- */

export const FAMILY_KEYWORDS: Record<string, SemanticEntry> = {
  flyer: {
    primaryKeyword: "flyers personnalisés",
    secondary: [
      "impression flyers", "prospectus publicitaires", "tracts personnalisés",
      "flyers pas chers", "flyers professionnels", "flyers recto verso",
      "flyers A5", "flyers A6", "flyers carrés", "flyers événementiels",
      "flyers restaurant", "flyers commerce", "impression petite quantité",
    ],
    synonyms: ["prospectus", "tract", "dépliant publicitaire"],
    longTail: [
      "imprimer des flyers personnalisés en ligne",
      "flyers recto verso pas chers en petite quantité",
      "impression de prospectus publicitaires événementiels",
    ],
    usages: [
      "Distribution en boîte aux lettres et boîtage",
      "Dépôt en point de vente et comptoir",
      "Distribution événementielle et street marketing",
      "Promotions, menus et annonces",
    ],
    sectors: ["restaurants", "commerces", "associations", "artisans", "événements"],
    materials: ["papier couché brillant", "papier couché mat", "papier recyclé"],
    formats: ["A7", "A6", "A5", "A4", "carré"],
    finitions: ["recto verso", "pelliculage mat", "pelliculage brillant"],
    commercialIntents: ["pas chers", "petite quantité", "grande quantité", "recto verso"],
    faq: [
      { q: "Quel grammage choisir pour mes flyers ?", a: "Pour une distribution classique, le 135 g/m² couché offre un excellent rapport qualité/prix. Pour un rendu premium, optez pour 250 à 350 g/m² avec pelliculage." },
      { q: "À partir de quelle quantité est-ce rentable ?", a: "Les tarifs dégressifs rendent l'impression rentable dès une centaine d'exemplaires, avec les meilleurs prix unitaires sur les grandes séries." },
      { q: "Puis-je imprimer mes flyers en recto verso ?", a: "Oui, le recto verso est disponible pour exploiter les deux faces de votre flyer." },
      { q: "Quels fichiers fournir ?", a: "Un PDF haute résolution (300 dpi), en CMJN, avec 3 mm de fonds perdus." },
      { q: "Quels formats de flyers proposez-vous ?", a: "Les formats courants vont du A7 au A4, ainsi que le format carré, selon le produit choisi." },
      { q: "Mes fichiers sont-ils vérifiés ?", a: "Oui, un contrôle qualité de votre PDF est réalisé avant impression." },
    ],
    complementary: ["impression-papier", "publicite-interieure", "objets-publicitaires-cadeaux"],
    anchors: ["flyers personnalisés", "prospectus publicitaires", "tracts événementiels"],
  },

  affiche: {
    primaryKeyword: "affiches personnalisées",
    secondary: [
      "impression poster", "affiche publicitaire", "affiche événementielle",
      "affiche promotionnelle", "poster imprimé", "impression grand format",
      "affiche intérieure", "affiche professionnelle", "affiche avec logo",
      "affiche sur mesure", "impression affiche en ligne", "affiche A2",
    ],
    synonyms: ["poster", "affichage"],
    longTail: [
      "imprimer une affiche personnalisée en ligne",
      "impression affiche publicitaire grand format",
      "affiche événementielle personnalisée petite quantité",
    ],
    usages: [
      "Campagnes promotionnelles et soldes",
      "Concerts, spectacles et expositions",
      "Affichage en vitrine et point de vente",
      "Décoration et posters grand format",
    ],
    sectors: ["commerces", "événements", "associations", "tourisme", "collectivités"],
    materials: ["papier couché", "papier photo satiné", "papier mat"],
    formats: ["A3", "A2", "A1", "A0", "format sur mesure"],
    finitions: ["pelliculage anti-UV", "contrecollage", "format affichage"],
    commercialIntents: ["sur mesure", "grand format", "devis gratuit", "petite quantité"],
    faq: [
      { q: "Quelle différence entre affiche intérieure et extérieure ?", a: "Les affiches intérieures sont sur papier couché classique ; pour l'extérieur, des supports résistants à l'eau et aux UV sont utilisés." },
      { q: "Puis-je imprimer une photo en poster grand format ?", a: "Oui, envoyez votre photo en haute résolution pour une impression nette jusqu'aux grands formats." },
      { q: "Quels formats d'affiche sont disponibles ?", a: "Les formats courants vont du A3 au A0, avec des formats sur mesure selon le produit." },
      { q: "Quelle résolution de fichier fournir ?", a: "Visez 150 dpi à taille réelle pour une affiche, en PDF CMJN avec fonds perdus." },
      { q: "Peut-on contrecoller l'affiche sur un support rigide ?", a: "Selon le produit, le contrecollage sur support rigide est possible pour un rendu plus durable." },
      { q: "Peut-on commander une petite quantité ?", a: "Oui, l'affiche se commande de l'unité à la grande série, avec un tarif dégressif." },
    ],
    complementary: ["publicite-interieure", "publicite-exterieure", "panneaux-baches-vinyles-toiles"],
    anchors: ["affiches personnalisées", "posters grand format", "affiches événementielles"],
  },

  carte: {
    primaryKeyword: "cartes de visite personnalisées",
    secondary: [
      "impression carte de visite", "carte de visite premium", "carte de visite recto verso",
      "carte de visite pelliculée", "carte de visite vernis sélectif", "carte de visite coins arrondis",
      "carte professionnelle", "carte de visite originale", "carte de visite mat",
      "carte de visite brillante", "carte de visite avec logo", "carte de visite pas chère",
    ],
    synonyms: ["carte professionnelle", "carte de visite"],
    longTail: [
      "imprimer des cartes de visite premium en ligne",
      "carte de visite pelliculée soft touch avec vernis sélectif",
      "carte de visite recto verso avec logo sur mesure",
    ],
    usages: [
      "Rendez-vous clients et networking",
      "Salons et événements professionnels",
      "Présentation de coordonnées et services",
      "Image de marque au quotidien",
    ],
    sectors: ["professions libérales", "artisans", "commerces", "entreprises", "agences immobilières"],
    materials: ["papier couché 350 g", "papier création", "papier coton", "papier recyclé"],
    formats: ["85x55 mm", "carré", "format sur mesure"],
    finitions: ["pelliculage mat", "pelliculage soft touch", "vernis sélectif", "coins arrondis", "dorure à chaud"],
    commercialIntents: ["premium", "recto verso", "avec logo", "devis gratuit"],
    faq: [
      { q: "Quel papier pour une carte de visite premium ?", a: "Le papier 350 g/m² avec pelliculage soft touch et vernis sélectif offre un rendu luxueux ; le coton épais est idéal pour un style épuré." },
      { q: "La carte peut-elle être recto verso ?", a: "Oui, le recto verso permet d'ajouter coordonnées, logo ou QR code au dos." },
      { q: "Quelles finitions sont disponibles ?", a: "Selon le produit : pelliculage mat ou brillant, soft touch, vernis sélectif, coins arrondis et dorure." },
      { q: "Quels fichiers fournir ?", a: "Un PDF haute résolution en CMJN avec 3 mm de fonds perdus et les textes vectorisés." },
      { q: "Proposez-vous des cartes écologiques ?", a: "Oui, des papiers recyclés et certifiés sont disponibles selon le produit." },
      { q: "Peut-on commander une petite quantité ?", a: "Oui, de petites quantités sont possibles, avec un tarif dégressif sur les volumes." },
    ],
    complementary: ["impression-papier", "objets-publicitaires-cadeaux", "etiquettes-stickers"],
    anchors: ["cartes de visite premium", "cartes professionnelles", "finitions soignées"],
  },

  brochure: {
    primaryKeyword: "brochures et dépliants personnalisés",
    secondary: [
      "impression brochure", "dépliant publicitaire", "plaquette commerciale",
      "catalogue personnalisé", "dépliant 3 volets", "brochure piquée",
      "brochure dos carré collé", "plaquette entreprise", "dépliant roulé",
      "brochure A4", "impression catalogue", "dépliant accordéon",
    ],
    synonyms: ["dépliant", "plaquette", "catalogue", "prospectus plié"],
    longTail: [
      "imprimer une brochure dos carré collé sur mesure",
      "dépliant 3 volets personnalisé pour entreprise",
      "plaquette commerciale haut de gamme en ligne",
    ],
    usages: [
      "Présentation d'entreprise et de services",
      "Catalogues produits et tarifs",
      "Documentation commerciale et menus",
      "Programmes d'événements",
    ],
    sectors: ["entreprises", "hôtels", "tourisme", "collectivités", "professions libérales"],
    materials: ["papier couché", "papier offset", "papier recyclé"],
    formats: ["A6", "A5", "A4", "DL", "carré"],
    finitions: ["piqûre à cheval", "dos carré collé", "pli roulé", "pli accordéon", "pelliculage"],
    commercialIntents: ["sur mesure", "devis gratuit", "petite quantité", "grande quantité"],
    faq: [
      { q: "Quelle reliure choisir pour une brochure ?", a: "La piqûre à cheval convient aux faibles paginations ; le dos carré collé donne un rendu livre sur les documents plus épais." },
      { q: "Quels types de pliage proposez-vous ?", a: "Selon le produit : pli roulé, accordéon, portefeuille ou économique, pour dépliants et plaquettes." },
      { q: "Combien de pages peut contenir une brochure ?", a: "La pagination dépend du produit et de la reliure choisie ; le configurateur indique les options disponibles." },
      { q: "Quels fichiers fournir ?", a: "Un PDF haute résolution en CMJN, pages dans l'ordre de lecture, avec fonds perdus." },
      { q: "Peut-on imprimer un catalogue avec photos ?", a: "Oui, l'impression haute définition restitue fidèlement photos et visuels produits." },
      { q: "Comment obtenir un devis brochure ?", a: "Configurez le produit en ligne pour un prix immédiat ou décrivez votre projet via le formulaire de devis." },
    ],
    complementary: ["impression-papier", "emballages-sacs", "objets-publicitaires-cadeaux"],
    anchors: ["brochures et catalogues", "dépliants publicitaires", "plaquettes commerciales"],
  },

  banner: {
    primaryKeyword: "banderoles et bâches publicitaires",
    secondary: [
      "bâche publicitaire", "banderole personnalisée", "bâche PVC",
      "banderole événementielle", "bâche façade", "banderole sur mesure",
      "bâche micro-perforée", "œillets renforcés", "bâche extérieure",
      "banderole grand format", "impression bâche en ligne", "bâche chantier",
    ],
    synonyms: ["bâche", "banderole", "banner"],
    longTail: [
      "imprimer une bâche publicitaire grand format sur mesure",
      "banderole événementielle avec œillets renforcés",
      "bâche micro-perforée pour zone ventée",
    ],
    usages: [
      "Façades et devantures de commerce",
      "Événements, festivals et manifestations",
      "Chantiers et signalétique temporaire",
      "Promotions et annonces extérieures",
    ],
    sectors: ["commerces", "événements", "industrie", "sport", "collectivités"],
    materials: ["bâche PVC", "bâche micro-perforée", "maille mesh"],
    formats: ["format sur mesure", "grand format"],
    finitions: ["œillets", "ourlets renforcés", "fourreaux"],
    commercialIntents: ["sur mesure", "devis gratuit", "grand format", "fabrication"],
    faq: [
      { q: "Ma banderole résiste-t-elle à la pluie et au vent ?", a: "Oui, les bâches PVC sont conçues pour un usage extérieur prolongé ; pour les zones très ventées, optez pour une bâche micro-perforée." },
      { q: "Quelles finitions de fixation proposez-vous ?", a: "Œillets métalliques, ourlets renforcés et fourreaux selon le mode de pose souhaité." },
      { q: "Puis-je commander un format sur mesure ?", a: "Oui, indiquez vos dimensions exactes lors de la configuration ou demandez un devis." },
      { q: "Quel fichier fournir pour une bâche ?", a: "Un PDF haute résolution à l'échelle, en CMJN, avec fonds perdus pour la finition." },
      { q: "La bâche peut-elle être imprimée recto verso ?", a: "Selon le produit, l'impression recto ou recto-verso est possible." },
      { q: "Quels sont les délais de fabrication ?", a: "La production grand format est généralement réalisée sous quelques jours ouvrés selon la quantité." },
    ],
    complementary: ["publicite-exterieure", "panneaux-baches-vinyles-toiles", "publicite-interieure"],
    anchors: ["bâches publicitaires", "banderoles sur mesure", "supports de façade"],
  },

  "roll-up": {
    primaryKeyword: "roll-up et kakémonos personnalisés",
    secondary: [
      "roll-up personnalisé", "kakémono publicitaire", "enrouleur publicitaire",
      "roll-up salon", "totem publicitaire", "roll-up 85x200", "roll-up 100x200",
      "toile roll-up", "structure aluminium", "roll-up réutilisable",
      "roll-up avec housse", "impression roll-up en ligne",
    ],
    synonyms: ["kakémono", "enrouleur", "totem"],
    longTail: [
      "imprimer un roll-up personnalisé pour salon professionnel",
      "kakémono publicitaire réutilisable avec housse de transport",
      "roll-up 85x200 avec structure aluminium",
    ],
    usages: [
      "Stands de salon et halls d'accueil",
      "Conférences, séminaires et inaugurations",
      "Vitrines et points de vente",
      "Communication événementielle itinérante",
    ],
    sectors: ["salons professionnels", "entreprises", "événements", "commerces", "hôtels"],
    materials: ["toile polyester anti-reflet", "film polypropylène", "structure aluminium"],
    formats: ["85x200 cm", "100x200 cm", "formats stand"],
    finitions: ["enrouleur avec housse", "structure réutilisable", "toile remplaçable"],
    commercialIntents: ["réutilisable", "personnalisé", "devis gratuit", "montage rapide"],
    faq: [
      { q: "Quelle est la durée de vie d'un roll-up ?", a: "Avec une utilisation régulière, un roll-up dure en moyenne 3 à 5 ans grâce à des encres résistantes." },
      { q: "Puis-je changer la toile de mon roll-up ?", a: "Oui, la plupart des modèles permettent de remplacer la toile tout en conservant la structure." },
      { q: "Quel fichier fournir ?", a: "Un PDF haute résolution (300 dpi), en CMJN, avec les fonds perdus requis." },
      { q: "Le roll-up est-il livré avec une housse ?", a: "Oui, la majorité des modèles incluent une housse de transport." },
      { q: "Quel format choisir pour un stand ?", a: "Le 85x200 cm est le standard ; le 100x200 cm offre une surface visuelle plus large." },
      { q: "Le montage est-il rapide ?", a: "Oui, le roll-up se déploie et se range en quelques secondes, sans outil." },
    ],
    complementary: ["publicite-interieure", "publicite-exterieure", "impression-papier"],
    anchors: ["roll-up personnalisés", "kakémonos publicitaires", "supports de stand"],
  },

  adhesif: {
    primaryKeyword: "adhésifs et autocollants personnalisés",
    secondary: [
      "sticker personnalisé", "autocollant vinyle", "adhésif vitrine",
      "vitrophanie", "lettrage adhésif", "étiquette adhésive", "sticker découpé",
      "marquage au sol", "adhésif véhicule", "sticker logo", "adhésif mural",
      "impression adhésif en ligne",
    ],
    synonyms: ["sticker", "autocollant", "vinyle", "vitrophanie"],
    longTail: [
      "imprimer des autocollants vinyle découpés à la forme",
      "adhésif vitrine personnalisé pour devanture",
      "lettrage adhésif pour véhicule sur mesure",
    ],
    usages: [
      "Vitrophanie et habillage de vitrine",
      "Lettrage et marquage de véhicule",
      "Signalétique et marquage au sol",
      "Stickers produit et décoration murale",
    ],
    sectors: ["commerces", "automobile", "industrie", "restaurants", "artisans"],
    materials: ["vinyle monomère", "vinyle polymère", "vinyle transparent", "film micro-perforé"],
    formats: ["découpe à la forme", "format sur mesure", "planche", "rouleau"],
    finitions: ["pelliculage anti-UV", "adhésif permanent", "adhésif repositionnable", "découpe numérique"],
    commercialIntents: ["sur mesure", "avec logo", "petite quantité", "devis gratuit"],
    faq: [
      { q: "Quelle est la durée de vie d'un adhésif extérieur ?", a: "Un vinyle polymère avec pelliculage dure 5 à 7 ans en extérieur ; un vinyle monomère offre 1 à 3 ans." },
      { q: "L'adhésif est-il repositionnable ?", a: "Des vinyles à colle repositionnable existent pour les usages temporaires, et à colle permanente pour les poses durables." },
      { q: "Peut-on découper à une forme personnalisée ?", a: "Oui, la découpe numérique réalise toutes les formes à partir d'un fichier vectoriel." },
      { q: "Quel adhésif pour une vitrine ?", a: "Le vinyle transparent ou le film micro-perforé conviennent à la vitrophanie selon l'effet recherché." },
      { q: "Quels fichiers fournir ?", a: "Un fichier vectoriel (PDF/AI) pour la découpe, ou un PDF haute résolution pour l'impression quadri." },
      { q: "Peut-on commander en petite quantité ?", a: "Oui, les quantités sont modulables avec un tarif dégressif." },
    ],
    complementary: ["etiquettes-stickers", "panneaux-baches-vinyles-toiles", "publicite-exterieure"],
    anchors: ["autocollants vinyle", "adhésifs vitrine", "lettrage véhicule"],
  },

  panneau: {
    primaryKeyword: "panneaux rigides personnalisés",
    secondary: [
      "panneau Dibond", "panneau Forex", "panneau Akilux", "panneau PVC",
      "signalétique rigide", "panneau immobilier", "plaque professionnelle",
      "panneau de chantier", "enseigne rigide", "panneau extérieur",
      "panneau sur mesure", "impression panneau en ligne",
    ],
    synonyms: ["panneau", "plaque", "signalétique", "enseigne"],
    longTail: [
      "imprimer un panneau Dibond personnalisé pour signalétique",
      "panneau immobilier rigide sur mesure",
      "panneau de chantier extérieur résistant",
    ],
    usages: [
      "Signalétique directionnelle et enseignes",
      "Panneaux immobiliers et de chantier",
      "Plaques professionnelles et PLV",
      "Décoration et affichage durable",
    ],
    sectors: ["agences immobilières", "industrie", "commerces", "collectivités", "artisans"],
    materials: ["Dibond", "Forex", "Akilux", "Plexiglas", "carton plume"],
    formats: ["A4", "A2", "A0", "grand format", "format sur mesure"],
    finitions: ["perçage de fixation", "angles arrondis", "découpe sur mesure", "impression recto-verso"],
    commercialIntents: ["sur mesure", "devis gratuit", "fabrication", "extérieur"],
    faq: [
      { q: "Quel support choisir pour un usage extérieur ?", a: "Le Dibond (aluminium composite) est la référence extérieure : rigide, léger et résistant ; l'Akilux est économique pour un usage temporaire." },
      { q: "Comment fixer mon panneau ?", a: "Vis et chevilles (pré-perçage possible), entretoises, rails de fixation ou adhésif double-face selon le support." },
      { q: "Proposez-vous l'impression recto-verso ?", a: "Oui, sur Dibond et Forex notamment, idéale pour les panneaux suspendus." },
      { q: "Peut-on découper le panneau à une forme ?", a: "Oui, une découpe sur mesure est possible à partir de votre fichier." },
      { q: "Quels fichiers fournir ?", a: "Un PDF haute résolution à l'échelle, en CMJN, avec fonds perdus." },
      { q: "Quels formats de panneaux sont disponibles ?", a: "Du petit format à très grand format, avec des dimensions sur mesure selon le produit." },
    ],
    complementary: ["publicite-exterieure", "panneaux-baches-vinyles-toiles", "publicite-interieure"],
    anchors: ["panneaux Dibond", "signalétique rigide", "panneaux immobiliers"],
  },

  "t-shirt": {
    primaryKeyword: "t-shirts et textiles personnalisés",
    secondary: [
      "t-shirt personnalisé", "polo personnalisé", "sweat personnalisé",
      "tee-shirt avec logo", "textile événementiel", "vêtement de travail",
      "marquage textile", "sérigraphie", "broderie", "flocage", "impression DTG",
      "tenue d'équipe",
    ],
    synonyms: ["tee-shirt", "textile", "vêtement personnalisé"],
    longTail: [
      "imprimer des t-shirts personnalisés avec logo",
      "polo brodé pour équipe d'entreprise",
      "sweat personnalisé pour événement sportif",
    ],
    usages: [
      "Uniformes et tenues d'équipe",
      "Événements sportifs et associatifs",
      "Merchandising et boutiques",
      "Salons et opérations terrain",
    ],
    sectors: ["entreprises", "sport", "événements", "associations", "artisans"],
    materials: ["coton", "coton bio", "polyester technique", "coton peigné"],
    formats: ["XS à 5XL", "coupe homme", "coupe femme"],
    finitions: ["sérigraphie", "broderie", "flocage", "impression DTG"],
    commercialIntents: ["avec logo", "petite quantité", "grande quantité", "sur mesure"],
    faq: [
      { q: "Quelle technique choisir pour mon textile ?", a: "Sérigraphie pour les grandes quantités, DTG pour les petites séries et visuels complexes, broderie pour un rendu premium et durable." },
      { q: "Les impressions résistent-elles au lavage ?", a: "Oui, les marquages résistent à des lavages répétés ; la broderie est la technique la plus durable." },
      { q: "Puis-je commander un échantillon ?", a: "Oui, un BAT textile peut être réalisé avant le lancement de la production." },
      { q: "Les tailles sont-elles modulables ?", a: "Oui, vous pouvez répartir les tailles au sein d'une même commande." },
      { q: "Quel fichier fournir pour le marquage ?", a: "Un fichier vectoriel du logo (PDF/AI) garantit un marquage net à toutes les tailles." },
      { q: "Peut-on commander en petite quantité ?", a: "Oui, l'impression numérique permet des petites séries personnalisées." },
    ],
    complementary: ["textiles-accessoires", "objets-publicitaires-cadeaux", "publicite-interieure"],
    anchors: ["t-shirts personnalisés", "polos brodés", "textiles d'équipe"],
  },

  mug: {
    primaryKeyword: "mugs personnalisés",
    secondary: [
      "mug publicitaire", "tasse personnalisée", "mug avec logo",
      "mug céramique", "mug sublimation", "cadeau d'entreprise mug",
      "goodies mug", "mug photo", "mug promotionnel", "mug entreprise",
      "impression mug en ligne", "mug isotherme",
    ],
    synonyms: ["tasse", "gobelet"],
    longTail: [
      "imprimer un mug personnalisé avec logo",
      "mug publicitaire en sublimation pour cadeau d'entreprise",
      "mug céramique personnalisé en petite quantité",
    ],
    usages: [
      "Cadeaux d'entreprise et fidélisation",
      "Goodies de salon et merchandising",
      "Cadeaux de fin d'année",
      "Objets promotionnels du quotidien",
    ],
    sectors: ["entreprises", "événements", "salons professionnels", "associations", "tourisme"],
    materials: ["céramique", "verre", "inox isotherme"],
    formats: ["contenance standard", "modèles variés"],
    finitions: ["sublimation panoramique", "marquage anse", "coffret cadeau"],
    commercialIntents: ["avec logo", "petite quantité", "grande quantité", "cadeau"],
    faq: [
      { q: "L'impression résiste-t-elle au lave-vaisselle ?", a: "Oui, la sublimation intègre l'encre dans la céramique : l'image ne s'efface pas après de nombreux lavages." },
      { q: "Quelle est la zone imprimable ?", a: "Sur un mug standard, la zone imprimable est panoramique ; le marquage sur l'anse est parfois possible." },
      { q: "À partir de combien de pièces commander ?", a: "À partir d'un seul exemplaire, avec des tarifs dégressifs selon la quantité." },
      { q: "Quel fichier fournir ?", a: "Un visuel haute résolution (300 dpi) aux dimensions de la zone d'impression." },
      { q: "Le mug peut-il être livré en coffret ?", a: "Selon le modèle, un emballage individuel ou un coffret cadeau est disponible." },
      { q: "Comment obtenir un devis ?", a: "Configurez le produit en ligne ou décrivez votre besoin dans le formulaire de devis." },
    ],
    complementary: ["objets-publicitaires-cadeaux", "textiles-accessoires", "emballages-sacs"],
    anchors: ["mugs personnalisés", "tasses publicitaires", "cadeaux d'entreprise"],
  },

  bottle: {
    primaryKeyword: "gourdes et bouteilles personnalisées",
    secondary: [
      "gourde personnalisée", "bouteille réutilisable", "gourde avec logo",
      "bouteille isotherme", "gourde inox", "gourde sport", "bouteille publicitaire",
      "cadeau d'entreprise gourde", "gourde éco-responsable", "bouteille tritan",
      "goodies gourde", "gourde sur mesure",
    ],
    synonyms: ["gourde", "bouteille"],
    longTail: [
      "gourde personnalisée réutilisable avec logo",
      "bouteille isotherme inox personnalisée pour entreprise",
      "gourde éco-responsable pour événement sportif",
    ],
    usages: [
      "Cadeaux d'entreprise et fidélisation",
      "Événements sportifs et goodies",
      "Démarches éco-responsables",
      "Objets utiles du quotidien",
    ],
    sectors: ["sport", "entreprises", "événements", "associations", "tourisme"],
    materials: ["inox isotherme", "tritan", "rPET recyclé"],
    formats: ["contenances variées", "modèles variés"],
    finitions: ["marquage durable", "gravure", "coloris variés"],
    commercialIntents: ["avec logo", "éco-responsable", "petite quantité", "grande quantité"],
    faq: [
      { q: "La gourde est-elle réutilisable et étanche ?", a: "Oui, nos gourdes sont conçues pour un usage quotidien réutilisable et un transport sans fuite." },
      { q: "Le marquage résiste-t-il au lavage ?", a: "Oui, le marquage est sélectionné pour résister à un usage et un nettoyage réguliers." },
      { q: "À partir de combien de pièces commander ?", a: "Les quantités minimales et tarifs dégressifs dépendent du modèle ; demandez un devis pour votre projet." },
      { q: "Proposez-vous des modèles isothermes ?", a: "Oui, des gourdes en inox isotherme conservent la température des boissons." },
      { q: "Quel fichier fournir pour le marquage ?", a: "Un logo vectoriel (PDF/AI) garantit un marquage net et précis." },
      { q: "La gourde est-elle éco-responsable ?", a: "Les modèles réutilisables et en matières recyclées s'inscrivent dans une démarche durable." },
    ],
    complementary: ["objets-publicitaires-cadeaux", "textiles-accessoires", "emballages-sacs"],
    anchors: ["gourdes personnalisées", "bouteilles réutilisables", "cadeaux éco-responsables"],
  },

  bag: {
    primaryKeyword: "sacs et tote bags personnalisés",
    secondary: [
      "tote bag personnalisé", "sac coton personnalisé", "sac avec logo",
      "sac réutilisable", "sac shopping", "sac publicitaire", "sac événementiel",
      "tote bag coton bio", "sac non-tissé", "goodies sac", "sac boutique",
      "sac sur mesure",
    ],
    synonyms: ["sac", "tote", "pochette", "emballage"],
    longTail: [
      "tote bag personnalisé en coton avec logo",
      "sac shopping réutilisable personnalisé pour boutique",
      "sac événementiel non-tissé sur mesure",
    ],
    usages: [
      "Sacs de boutique et shopping",
      "Tote bags événementiels et goodies",
      "Sacs réutilisables éco-responsables",
      "Merchandising et cadeaux clients",
    ],
    sectors: ["commerces", "événements", "associations", "tourisme", "entreprises"],
    materials: ["coton", "coton bio", "non-tissé", "matières recyclées"],
    formats: ["formats variés", "format sur mesure"],
    finitions: ["anses longues", "marquage sérigraphie", "coloris variés"],
    commercialIntents: ["avec logo", "réutilisable", "petite quantité", "grande quantité"],
    faq: [
      { q: "Quelles matières de sacs proposez-vous ?", a: "Coton, coton bio, non-tissé ou matières recyclées selon le modèle et l'usage souhaité." },
      { q: "Le marquage résiste-t-il à l'usage ?", a: "Oui, le marquage est adapté à la matière pour une bonne tenue dans le temps." },
      { q: "Puis-je commander un format sur mesure ?", a: "Selon les modèles, des formats et finitions personnalisés sont possibles ; demandez un devis." },
      { q: "Le sac est-il réutilisable et lavable ?", a: "Les sacs en coton sont réutilisables et lavables, idéals pour une démarche durable." },
      { q: "Quel fichier fournir pour le marquage ?", a: "Un logo vectoriel (PDF/AI) garantit un marquage net sur le textile." },
      { q: "Peut-on commander en petite quantité ?", a: "Oui, les quantités sont modulables avec un tarif dégressif." },
    ],
    complementary: ["emballages-sacs", "objets-publicitaires-cadeaux", "textiles-accessoires"],
    anchors: ["tote bags personnalisés", "sacs coton", "sacs réutilisables"],
  },

  menu: {
    primaryKeyword: "menus et supports de restauration personnalisés",
    secondary: [
      "menu restaurant personnalisé", "carte de restaurant", "set de table personnalisé",
      "menu plastifié", "carte des vins", "menu à emporter", "support traiteur",
      "menu événementiel", "carte de bar", "menu pelliculé", "impression menu en ligne",
      "ardoise menu",
    ],
    synonyms: ["carte restaurant", "menu", "set de table"],
    longTail: [
      "imprimer un menu de restaurant personnalisé en ligne",
      "carte des vins plastifiée sur mesure",
      "set de table personnalisé pour restaurant",
    ],
    usages: [
      "Cartes et menus de restaurant",
      "Cartes des vins et de bar",
      "Sets de table et supports traiteur",
      "Menus événementiels et à emporter",
    ],
    sectors: ["restaurants", "hôtels", "tourisme", "événements", "commerces"],
    materials: ["papier couché", "papier plastifié", "papier recyclé"],
    formats: ["A4", "A5", "DL", "format sur mesure"],
    finitions: ["pelliculage protecteur", "recto verso", "pli central"],
    commercialIntents: ["sur mesure", "devis gratuit", "recto verso", "petite quantité"],
    faq: [
      { q: "Peut-on plastifier un menu pour le protéger ?", a: "Oui, un pelliculage protecteur prolonge la durée de vie d'un menu manipulé fréquemment." },
      { q: "Quels formats pour une carte de restaurant ?", a: "Les formats A4, A5 et DL sont courants, avec des formats sur mesure selon le produit." },
      { q: "Le menu peut-il être recto verso ?", a: "Oui, le recto verso permet d'organiser entrées, plats, desserts et boissons." },
      { q: "Quels fichiers fournir ?", a: "Un PDF haute résolution en CMJN avec fonds perdus, textes relus et vectorisés." },
      { q: "Peut-on commander une petite quantité ?", a: "Oui, le menu se commande de quelques exemplaires à de plus grandes séries." },
      { q: "Comment obtenir un devis ?", a: "Configurez votre support en ligne ou décrivez votre besoin via le formulaire de devis." },
    ],
    complementary: ["impression-papier", "emballages-sacs", "etiquettes-stickers"],
    anchors: ["menus de restaurant", "cartes et sets de table", "supports traiteur"],
  },
};

export const FAMILY_KEYS = Object.keys(FAMILY_KEYWORDS);
