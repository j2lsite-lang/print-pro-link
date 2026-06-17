/**
 * Produces factual, family-accurate product copy for fiche produit pages.
 *
 * Rules enforced here (supplier audit):
 *  - Each product gets copy matching ITS real family — never a neighbour's.
 *  - Hard guardrails prevent cross-contamination
 *    (bottle ≠ mug, poster ≠ flyer, bag ≠ brochure, textile ≠ papeterie).
 *  - When no reliable family is detected we return SHORT, factual fallback
 *    copy built from the product name — never a long generic marketing block.
 */

import { normalize } from "./search";

interface ProductSEOData {
  intro: string;
  useCases: string;
  quality: string;
  faq: { q: string; a: string }[];
}

const KEYWORD_MAP: Record<string, ProductSEOData> = {
  "roll-up": {
    intro:
      "Le roll-up est l'outil de communication incontournable pour vos événements professionnels, salons, séminaires et points de vente. Léger, transportable et facile à installer en quelques secondes, il attire immédiatement le regard grâce à sa surface d'impression grand format. Chez J2L Print, nous imprimons vos roll-ups sur des supports haute définition avec des encres éco-solvant résistantes aux UV.",
    useCases:
      "Idéal pour les stands d'exposition, les halls d'accueil, les vitrines de magasin, les conférences ou encore les inaugurations, le roll-up s'adapte à tous les contextes de communication visuelle. Disponible en plusieurs largeurs avec des structures en aluminium robustes et un mécanisme d'enroulement fluide.",
    quality:
      "Chaque roll-up est imprimé sur une bâche polyester anti-reflet ou un film polypropylène premium selon le modèle choisi. La résolution atteint 1440 dpi pour des visuels nets. Livré avec sa housse de transport, votre roll-up est prêt à l'emploi.",
    faq: [
      { q: "Quelle est la durée de vie d'un roll-up ?", a: "Avec une utilisation régulière, un roll-up dure en moyenne 3 à 5 ans. La bâche conserve ses couleurs grâce à nos encres résistantes aux UV." },
      { q: "Puis-je changer la bâche de mon roll-up ?", a: "Oui, la plupart de nos modèles permettent de remplacer la bâche imprimée tout en conservant la structure." },
      { q: "Quel fichier fournir pour l'impression ?", a: "Envoyez un fichier PDF haute résolution (300 dpi minimum), en CMJN, avec 2 mm de fonds perdus." },
    ],
  },
  "banner": {
    intro:
      "La banderole publicitaire (ou bâche bannière) est un support de communication extérieur polyvalent et économique. Imprimée en grand format, elle est parfaite pour signaler un événement, promouvoir une offre ou habiller la façade de votre entreprise. J2L Print imprime vos banderoles sur bâche PVC résistante aux intempéries.",
    useCases:
      "Utilisez votre banderole pour annoncer des soldes, une ouverture de magasin, un festival, un chantier ou une manifestation sportive. Équipées d'œillets métalliques pour une fixation facile sur tout type de support, disponibles dans des formats sur mesure.",
    quality:
      "Impression numérique grand format en haute résolution (1440 dpi) sur bâche PVC recto ou recto-verso. Finitions disponibles : œillets, ourlets renforcés, fourreaux. Bâches micro-perforées disponibles pour les zones ventées.",
    faq: [
      { q: "Ma banderole résiste-t-elle à la pluie et au vent ?", a: "Oui, nos bâches PVC sont conçues pour un usage extérieur prolongé. Pour les zones très ventées, nous proposons des bâches micro-perforées." },
      { q: "Quels sont les délais de fabrication ?", a: "Comptez 3 à 5 jours ouvrés pour la production et l'expédition. Un service express est disponible sur demande." },
      { q: "Puis-je commander un format sur mesure ?", a: "Oui, indiquez vos dimensions exactes lors de la commande ou demandez un devis personnalisé." },
    ],
  },
  "flyer": {
    intro:
      "Le flyer reste l'un des supports de communication les plus efficaces pour toucher un large public à moindre coût. Distribution en boîte aux lettres, dépôt en point de vente ou distribution événementielle : il capte l'attention et transmet votre message en un coup d'œil. J2L Print imprime vos flyers sur des papiers premium avec une qualité offset irréprochable.",
    useCases:
      "Restaurants, commerces, associations, agences immobilières, artisans : le flyer s'adapte à tous les secteurs. Annoncez une promotion, un événement, un menu ou présentez vos services. Disponible du format A7 au A3, en recto seul ou recto-verso, avec de nombreuses finitions.",
    quality:
      "Impression offset ou numérique haute définition selon la quantité, sur papiers de 90 à 400 g/m². Chaque lot est contrôlé avant expédition. Papiers certifiés FSC et PEFC issus de forêts gérées durablement.",
    faq: [
      { q: "Quel grammage choisir pour mes flyers ?", a: "Pour une distribution classique, le 135 g/m² couché brillant offre un excellent rapport qualité/prix. Pour un rendu premium, optez pour le 250 ou 350 g/m² avec pelliculage." },
      { q: "À partir de quelle quantité est-ce rentable ?", a: "Nos tarifs dégressifs rendent l'impression rentable dès 100 exemplaires, avec les meilleurs prix unitaires à partir de 1 000 exemplaires." },
      { q: "Pouvez-vous créer la maquette de mon flyer ?", a: "Oui, notre studio graphique réalise votre maquette sur devis à partir de vos textes, logos et photos." },
    ],
  },
  "carte": {
    intro:
      "La carte de visite est le premier ambassadeur de votre image professionnelle. Échangée lors de rendez-vous, salons ou rencontres networking, elle doit refléter le sérieux de votre entreprise. J2L Print imprime vos cartes de visite sur des supports haut de gamme avec des finitions soignées.",
    useCases:
      "Indispensable pour les entrepreneurs, freelances, commerciaux, professions libérales et artisans, la carte de visite transmet vos coordonnées de manière mémorable. Formats standards ou originaux, impression recto-verso pour maximiser l'information.",
    quality:
      "Impression sur papiers premium de 300 à 600 g/m². Finitions : pelliculage mat, brillant ou soft touch, vernis sélectif, dorure à chaud, coins arrondis. Massicotage de précision pour des bords nets.",
    faq: [
      { q: "Quel papier choisir pour une carte de visite premium ?", a: "Le papier création 350 g/m² avec pelliculage soft touch et vernis sélectif offre un rendu luxueux. Pour un style épuré, le coton 600 g/m² est idéal." },
      { q: "Combien de temps pour recevoir mes cartes ?", a: "Production en 3 à 5 jours ouvrés, expédition comprise. Service express disponible en supplément." },
      { q: "Proposez-vous des cartes de visite écologiques ?", a: "Oui, nous proposons des papiers recyclés et certifiés FSC/PEFC ainsi que des encres végétales." },
    ],
  },
  "affiche": {
    intro:
      "L'affiche imprimée reste un média puissant pour capter l'attention dans l'espace public ou en point de vente. Qu'il s'agisse d'une affiche événementielle, d'un poster décoratif ou d'une affiche promotionnelle, J2L Print garantit une impression haute résolution avec des couleurs fidèles et percutantes.",
    useCases:
      "Concerts, spectacles, expositions, campagnes publicitaires, affichage municipal, décoration : l'affiche s'adapte à tous les usages. Formats du A4 au B0 et formats personnalisés. Supports résistants à l'humidité disponibles pour l'extérieur.",
    quality:
      "Impression numérique grand format en 1440 dpi ou offset pour les grandes séries. Papiers couché, mat, blue back, synthétique ou photo satiné. Options : pelliculage anti-UV, contrecollage sur support rigide.",
    faq: [
      { q: "Quelle est la différence entre affiche intérieur et extérieur ?", a: "Les affiches intérieur sont sur papier couché classique. Pour l'extérieur, nous utilisons des supports résistants à l'eau et aux UV avec pelliculage de protection." },
      { q: "Puis-je faire imprimer une photo en poster grand format ?", a: "Oui, envoyez votre photo en haute résolution et nous l'imprimons jusqu'au format B0." },
      { q: "Proposez-vous le contrecollage ?", a: "Oui, sur Dibond, Forex ou carton plume pour un rendu rigide et professionnel." },
    ],
  },
  "adhesif": {
    intro:
      "L'adhésif vinyle personnalisé est un support polyvalent qui s'adapte à toutes les surfaces : vitrines, véhicules, murs, sols, mobilier, signalétique. J2L Print imprime vos stickers et adhésifs sur des vinyles professionnels avec des encres éco-solvant résistantes aux UV, à l'eau et aux rayures.",
    useCases:
      "Vitrophanie de devanture, lettrage de véhicule, signalétique directionnelle, décoration murale, stickers produit, étiquettes adhésives, marquage au sol : les possibilités sont infinies. Finitions brillante, mate, satinée, transparente ou micro-perforée.",
    quality:
      "Impression sur vinyle monomère (usage temporaire) ou polymère (longue durée). Découpe numérique pour des contours précis, y compris les formes complexes. Pelliculage de protection anti-UV disponible.",
    faq: [
      { q: "Quelle est la durée de vie d'un adhésif extérieur ?", a: "Un vinyle polymère avec pelliculage dure 5 à 7 ans en extérieur. Pour un usage temporaire, un vinyle monomère offre 1 à 3 ans de tenue." },
      { q: "L'adhésif est-il repositionnable ?", a: "Nous proposons des vinyles à colle repositionnable pour les usages temporaires et à colle définitive pour les usages permanents." },
      { q: "Pouvez-vous découper mon adhésif à une forme personnalisée ?", a: "Oui, notre découpe numérique réalise toutes les formes à partir de votre fichier vectoriel." },
    ],
  },
  "panneau": {
    intro:
      "Le panneau rigide imprimé est la solution idéale pour la signalétique, l'affichage publicitaire durable et la décoration professionnelle. Imprimé directement sur support rigide (Dibond, Forex, Akylux, PVC) ou contrecollé, il offre un rendu impeccable et une tenue exceptionnelle dans le temps.",
    useCases:
      "Enseignes, panneaux de chantier, signalétique directionnelle, PLV, panneaux immobiliers, plaques professionnelles, décoration : le panneau rigide couvre de nombreuses applications intérieures et extérieures. Formats du A4 au très grand format.",
    quality:
      "Impression UV directe à plat en 1440 dpi sur Dibond, Forex, Akylux, Plexiglas ou carton plume. Découpe sur mesure, perçage pour fixation, angles arrondis sur demande. Tenue extérieure de plusieurs années.",
    faq: [
      { q: "Quel support choisir pour un usage extérieur ?", a: "Le Dibond (aluminium composite) est la référence extérieure : rigide, léger et résistant. L'Akylux est économique pour un usage temporaire." },
      { q: "Comment fixer mon panneau ?", a: "Vis et chevilles (pré-perçage possible), entretoises inox, rails de fixation ou adhésif double-face haute performance." },
      { q: "Proposez-vous l'impression recto-verso ?", a: "Oui, sur Dibond et Forex, idéale pour les panneaux suspendus visibles des deux côtés." },
    ],
  },
  "t-shirt": {
    intro:
      "Le textile personnalisé est un vecteur de communication puissant pour les entreprises, associations, événements sportifs et collectivités. J2L Print personnalise vos textiles par sérigraphie, impression numérique DTG, flocage ou broderie selon vos besoins et quantités.",
    useCases:
      "Uniformes d'entreprise, tenues d'équipe sportive, merchandising, textiles événementiels, cadeaux d'entreprise : le textile personnalisé fédère et communique. Disponible en coton bio, polyester technique ou coton peigné, dans toutes les tailles.",
    quality:
      "Sérigraphie pour les grandes séries avec encres résistantes au lavage, DTG pour les petites quantités et visuels photo, flocage pour les noms et numéros, broderie pour un rendu haut de gamme et durable.",
    faq: [
      { q: "Quelle technique choisir pour mon textile ?", a: "Sérigraphie pour les grandes quantités, DTG pour les petites séries et visuels complexes, broderie pour un rendu premium et durable." },
      { q: "Les impressions résistent-elles au lavage ?", a: "Oui, nos impressions résistent à plus de 60 lavages à 40°C. La broderie est la technique la plus durable." },
      { q: "Puis-je commander un échantillon ?", a: "Oui, nous réalisons un BAT textile avant le lancement de votre production." },
    ],
  },
  "mug": {
    intro:
      "Le mug personnalisé est un objet publicitaire incontournable : utile au quotidien, il garde votre marque sous les yeux de vos clients et collaborateurs à chaque pause café. J2L Print imprime vos mugs en sublimation haute définition pour des couleurs éclatantes et une résistance au lave-vaisselle.",
    useCases:
      "Cadeaux d'entreprise, goodies de salon, merchandising, objets promotionnels, cadeaux de fin d'année : le mug personnalisé est toujours apprécié. Modèles en céramique, verre ou inox isotherme.",
    quality:
      "Impression par sublimation thermique : l'image est intégrée dans la matière, résistante au lave-vaisselle et au micro-ondes. Résolution photographique. Emballage individuel ou coffret cadeau disponible.",
    faq: [
      { q: "L'impression résiste-t-elle au lave-vaisselle ?", a: "Oui, la sublimation intègre l'encre dans la céramique : l'image ne s'efface pas après des centaines de lavages." },
      { q: "Quelle est la zone imprimable ?", a: "Sur un mug standard, la zone imprimable est panoramique. Impression intérieure et sur l'anse également disponibles." },
      { q: "À partir de combien de pièces puis-je commander ?", a: "À partir d'un seul exemplaire, avec des tarifs dégressifs selon la quantité." },
    ],
  },
  "bottle": {
    intro:
      "La bouteille (ou gourde) personnalisée est un objet publicitaire durable et utile au quotidien. Réutilisable et écologique, elle accompagne vos clients et collaborateurs partout en mettant votre marque en avant. J2L Print personnalise vos bouteilles avec un marquage net et résistant.",
    useCases:
      "Cadeaux d'entreprise, goodies de salon, événements sportifs, démarches éco-responsables : la bouteille réutilisable est un objet apprécié et utile. Modèles en inox isotherme, tritan ou rPET selon le besoin.",
    quality:
      "Marquage soigné et durable adapté à la matière de la bouteille. Contenances et coloris variés. Chaque pièce est contrôlée avant expédition pour garantir un rendu impeccable.",
    faq: [
      { q: "La bouteille est-elle réutilisable et étanche ?", a: "Oui, nos bouteilles sont conçues pour un usage quotidien réutilisable et un transport sans fuite." },
      { q: "Le marquage résiste-t-il au lavage ?", a: "Oui, le marquage est sélectionné pour résister à un usage et un nettoyage réguliers." },
      { q: "À partir de combien de pièces puis-je commander ?", a: "Les quantités minimales et tarifs dégressifs dépendent du modèle. Demandez un devis pour votre projet." },
    ],
  },
  "bag": {
    intro:
      "Le sac personnalisé est un support de communication mobile et réutilisable qui prolonge la visibilité de votre marque bien au-delà du point de vente. J2L Print personnalise vos sacs et emballages avec un marquage soigné adapté à la matière choisie.",
    useCases:
      "Sacs de boutique, tote bags événementiels, emballages cadeaux, sacs réutilisables éco-responsables : le sac personnalisé combine utilité et communication. Modèles en coton, papier ou matières recyclées.",
    quality:
      "Marquage net et durable adapté à la matière du sac (coton, papier, non-tissé). Coloris et formats variés. Contrôle qualité avant expédition.",
    faq: [
      { q: "Quelles matières de sacs proposez-vous ?", a: "Coton, papier kraft, non-tissé ou matières recyclées selon le modèle et l'usage souhaité." },
      { q: "Le marquage résiste-t-il à l'usage ?", a: "Oui, le marquage est adapté à la matière pour une bonne tenue dans le temps." },
      { q: "Puis-je commander un format sur mesure ?", a: "Selon les modèles, des formats et finitions personnalisés sont possibles. Demandez un devis." },
    ],
  },
};

/**
 * Ordered family detectors. The FIRST family whose token appears in the
 * product name/SKU AND whose `forbid` tokens are absent wins. The order +
 * guardrails guarantee no cross-contamination between families.
 */
const FAMILY_DETECTORS: { key: keyof typeof KEYWORD_MAP; tokens: string[]; forbid?: string[] }[] = [
  { key: "bottle", tokens: ["bottle", "bouteille", "gourde", "drinkware", "drinking"] },
  { key: "mug", tokens: ["mug", "tasse", "gobelet"], forbid: ["bottle", "bouteille", "gourde", "drinking"] },
  { key: "t-shirt", tokens: ["t shirt", "tshirt", "tee shirt", "textile", "polo", "sweat", "hoodie", "vetement", "veste", "softshell"] },
  { key: "bag", tokens: ["bag", "sac", "sachet", "tote", "pochette", "emballage"] },
  { key: "affiche", tokens: ["affiche", "poster"], forbid: ["flyer", "prospectus", "tract"] },
  { key: "flyer", tokens: ["flyer", "prospectus", "tract", "leaflet", "depliant"], forbid: ["poster", "affiche", "bag", "sac"] },
  { key: "carte", tokens: ["carte de visite", "business card", "businesscard", "visite"] },
  { key: "roll-up", tokens: ["roll up", "rollup", "kakemono", "enrouleur", "totem"] },
  { key: "banner", tokens: ["banner", "banderole", "bache", "drapeau", "oriflamme", "pavillon"] },
  { key: "adhesif", tokens: ["adhesif", "sticker", "autocollant", "vinyle", "vitrophanie", "etiquette", "label"] },
  { key: "panneau", tokens: ["panneau", "plaque", "signaletique", "enseigne", "dibond", "forex", "akylux", "plv"] },
];

/** Short, factual fallback copy built from the product name (no marketing block). */
function buildGenericData(productName: string): ProductSEOData {
  const name = productName.trim() || "ce produit";
  const lower = name.toLowerCase();
  return {
    intro:
      `${name} fait partie du catalogue d'impression et de communication J2L Print. ` +
      `Configurez votre produit (format, quantité, options) directement en ligne et obtenez un prix immédiat.`,
    useCases:
      `Utilisez ${lower} pour vos besoins de communication professionnelle. ` +
      `Sélectionnez vos options ci-dessus pour adapter le produit à votre projet, ou demandez un devis personnalisé.`,
    quality:
      "Impression et finition professionnelles, contrôle qualité avant expédition et vérification de vos fichiers PDF. " +
      "Livraison en France métropolitaine sous 3 à 5 jours ouvrés.",
    faq: [
      { q: "Quels fichiers fournir pour l'impression ?", a: "Un fichier PDF haute résolution (300 dpi), en CMJN, avec les fonds perdus requis. Notre équipe vérifie votre fichier avant impression." },
      { q: "Comment obtenir un prix ?", a: "Configurez vos options ci-dessus : le prix se calcule automatiquement. Vous pouvez aussi demander un devis personnalisé." },
    ],
  };
}

/**
 * Find the best matching SEO data for a given product, with hard guardrails to
 * avoid using a neighbouring product's family copy.
 */
export function getProductSEOData(productName: string, sku?: string): ProductSEOData {
  const search = normalize(`${productName} ${sku || ""}`);

  for (const detector of FAMILY_DETECTORS) {
    const hasToken = detector.tokens.some((t) => search.includes(normalize(t)));
    if (!hasToken) continue;
    const forbidden = detector.forbid?.some((t) => search.includes(normalize(t)));
    if (forbidden) continue;
    return KEYWORD_MAP[detector.key];
  }

  return buildGenericData(productName);
}
