/**
 * Generates rich, unique SEO product descriptions based on product name/SKU.
 * Each product type gets a tailored, substantial description block.
 */

interface ProductSEOData {
  intro: string;
  useCases: string;
  quality: string;
  faq: { q: string; a: string }[];
}

const KEYWORD_MAP: Record<string, ProductSEOData> = {
  "roll-up": {
    intro:
      "Le roll-up est l'outil de communication incontournable pour vos événements professionnels, salons, séminaires et points de vente. Léger, transportable et facile à installer en quelques secondes, il attire immédiatement le regard grâce à sa surface d'impression grand format. Chez J2L Print, nous imprimons vos roll-ups sur des supports haute définition avec des encres éco-solvant résistantes aux UV, garantissant une durabilité exceptionnelle même en cas d'utilisation intensive.",
    useCases:
      "Idéal pour les stands d'exposition, les halls d'accueil, les vitrines de magasin, les conférences ou encore les inaugurations, le roll-up s'adapte à tous les contextes de communication visuelle. Associez-le à vos flyers et cartes de visite pour une identité de marque cohérente. Nos roll-ups sont disponibles en plusieurs largeurs (60 cm, 80 cm, 85 cm, 100 cm, 120 cm) et hauteurs (jusqu'à 200 cm), avec des structures en aluminium robustes et un mécanisme d'enroulement fluide.",
    quality:
      "Chaque roll-up est imprimé sur une bâche polyester anti-reflet de 510 g/m² ou un film polypropylène premium selon le modèle choisi. La résolution d'impression atteint 1440 dpi pour des visuels nets, des couleurs éclatantes et des dégradés parfaits. Le système de tension assure un rendu parfaitement lisse, sans pli ni gondolement. Livré avec sa housse de transport, votre roll-up est prêt à l'emploi.",
    faq: [
      { q: "Quelle est la durée de vie d'un roll-up ?", a: "Avec une utilisation régulière (montage/démontage fréquent), un roll-up J2L Print dure en moyenne 3 à 5 ans. La bâche imprimée conserve ses couleurs même après une exposition prolongée grâce à nos encres résistantes aux UV." },
      { q: "Puis-je changer la bâche de mon roll-up ?", a: "Oui, la plupart de nos modèles permettent de remplacer la bâche imprimée tout en conservant la structure. Contactez-nous pour commander une bâche de remplacement." },
      { q: "Quel fichier fournir pour l'impression ?", a: "Envoyez un fichier PDF en haute résolution (300 dpi minimum), en mode CMJN, avec 2 mm de fonds perdus. Notre équipe vérifie gratuitement votre fichier avant impression." },
    ],
  },
  "banner": {
    intro:
      "La banderole publicitaire (ou bâche bannière) est un support de communication extérieur polyvalent et économique. Imprimée en grand format, elle est parfaite pour signaler un événement, promouvoir une offre commerciale ou habiller la façade de votre entreprise. J2L Print imprime vos banderoles sur bâche PVC 510 g/m² avec des encres éco-solvant résistantes aux intempéries, garantissant une tenue optimale en extérieur pendant plusieurs mois.",
    useCases:
      "Utilisez votre banderole pour annoncer des soldes, une ouverture de magasin, un festival, un chantier, une manifestation sportive ou tout événement nécessitant une visibilité maximale. Nos banderoles sont équipées d'œillets métalliques tous les 50 cm pour une fixation facile sur tout type de support : grilles, poteaux, façades, barrières. Disponibles dans des formats sur mesure, du petit format 100x50 cm jusqu'au très grand format 10x2 m.",
    quality:
      "Impression numérique grand format en haute résolution (1440 dpi) sur bâche PVC enduite recto ou recto-verso. Finitions disponibles : œillets, ourlets renforcés, fourreaux pour barres de suspension. Nos bâches résistent au vent (micro-perforations disponibles), à la pluie et aux UV. Chaque commande bénéficie d'un contrôle colorimétrique avant expédition.",
    faq: [
      { q: "Ma banderole résiste-t-elle à la pluie et au vent ?", a: "Oui, nos bâches PVC 510 g/m² sont conçues pour un usage extérieur prolongé. Pour les zones très ventées, nous proposons des bâches micro-perforées qui laissent passer l'air tout en conservant l'impact visuel." },
      { q: "Quels sont les délais de fabrication ?", a: "Comptez 3 à 5 jours ouvrés pour la production et l'expédition. Un service express est disponible sur demande pour les commandes urgentes." },
      { q: "Puis-je commander un format sur mesure ?", a: "Absolument ! Indiquez vos dimensions exactes lors de la commande ou contactez-nous pour un devis personnalisé. Nous imprimons jusqu'à 5 m de large en une seule pièce." },
    ],
  },
  "flyer": {
    intro:
      "Le flyer reste l'un des supports de communication les plus efficaces pour toucher un large public à moindre coût. Distribution en boîte aux lettres, dépôt en point de vente, distribution événementielle : le flyer capte l'attention et transmet votre message en un coup d'œil. Chez J2L Print, nous imprimons vos flyers sur des papiers premium (couché brillant, mat ou recyclé) avec une qualité offset irréprochable.",
    useCases:
      "Restaurants, commerces, associations, agences immobilières, artisans… le flyer s'adapte à tous les secteurs. Annoncez une promotion, un événement, un menu, une journée portes ouvertes ou présentez vos services. Nos flyers sont disponibles du format A7 (carte postale) au A3 (affiche pliée), en impression recto seul ou recto-verso, avec de nombreuses options de finition : pelliculage mat ou brillant, vernis sélectif, dorure à chaud, découpe à la forme.",
    quality:
      "Impression offset ou numérique haute définition selon la quantité commandée, sur papiers de 90 g/m² à 400 g/m². Respect strict des couleurs Pantone sur demande. Chaque lot est contrôlé avant expédition : alignement, densité d'encre, massicotage. Nous utilisons exclusivement des papiers certifiés FSC et PEFC issus de forêts gérées durablement.",
    faq: [
      { q: "Quel grammage choisir pour mes flyers ?", a: "Pour une distribution classique, le 135 g/m² couché brillant offre un excellent rapport qualité/prix. Pour un rendu plus premium (invitation, carte de restaurant), optez pour le 250 g/m² ou 350 g/m² avec pelliculage." },
      { q: "À partir de quelle quantité est-ce rentable ?", a: "Nos tarifs dégressifs rendent l'impression rentable dès 100 exemplaires. Les meilleurs prix unitaires s'obtiennent à partir de 1 000 exemplaires grâce à l'impression offset." },
      { q: "Pouvez-vous créer la maquette de mon flyer ?", a: "Oui ! Notre studio graphique réalise votre maquette à partir de 65 € HT. Envoyez-nous vos textes, logos et photos, nous nous occupons du reste." },
    ],
  },
  "carte": {
    intro:
      "La carte de visite est le premier ambassadeur de votre image professionnelle. Échangée lors de rendez-vous, salons ou rencontres networking, elle doit refléter le sérieux et le positionnement de votre entreprise. J2L Print imprime vos cartes de visite sur des supports haut de gamme avec des finitions soignées qui font la différence : pelliculage soft touch, vernis sélectif, dorure à chaud, coins arrondis, découpe originale.",
    useCases:
      "Indispensable pour les entrepreneurs, freelances, commerciaux, professions libérales et artisans, la carte de visite transmet vos coordonnées de manière mémorable. Choisissez parmi nos formats standards (85x55 mm, 90x50 mm) ou créez un format original pour vous démarquer. Impression recto-verso pour maximiser l'espace d'information : logo, QR code, réseaux sociaux, plan d'accès.",
    quality:
      "Impression sur papiers premium de 300 g/m² à 600 g/m² : couché, création texturé, coton, kraft, PVC transparent. Finitions exclusives : pelliculage mat ou brillant, soft touch velours, vernis 3D sélectif, dorure ou argenture à chaud, gaufrage, bords colorés (edge painting). Chaque carte est massicotée avec une précision de 0,5 mm pour des bords nets et professionnels.",
    faq: [
      { q: "Quel papier choisir pour une carte de visite premium ?", a: "Le papier création 350 g/m² avec pelliculage soft touch et vernis sélectif offre un toucher velouté et un rendu luxueux. Pour un style épuré, le papier coton 600 g/m² avec impression letterpress est idéal." },
      { q: "Combien de temps pour recevoir mes cartes ?", a: "Production en 3 à 5 jours ouvrés, expédition comprise. Service express 24-48h disponible en supplément." },
      { q: "Proposez-vous des cartes de visite écologiques ?", a: "Oui, nous proposons des papiers recyclés et certifiés FSC/PEFC, ainsi que des encres végétales. Contactez-nous pour un devis éco-responsable." },
    ],
  },
  "affiche": {
    intro:
      "L'affiche imprimée reste un média puissant pour capter l'attention dans l'espace public ou en point de vente. Qu'il s'agisse d'une affiche événementielle, d'un poster décoratif ou d'une affiche promotionnelle, J2L Print garantit une impression haute résolution avec des couleurs fidèles et percutantes. Nos affiches sont imprimées sur des papiers de qualité supérieure, adaptés à un affichage intérieur ou extérieur selon le support choisi.",
    useCases:
      "Concerts, spectacles, expositions, campagnes publicitaires, affichage municipal, décoration de bureaux… l'affiche s'adapte à tous les usages. Formats disponibles du A4 au B0 (120x176 cm) et formats personnalisés sur demande. Pour l'extérieur, optez pour notre papier blue back 130 g/m² résistant à l'humidité ou notre support synthétique indéchirable.",
    quality:
      "Impression numérique grand format en 1440 dpi ou impression offset pour les grandes séries. Papiers disponibles : couché brillant 135 g/m², mat 170 g/m², blue back, synthétique polyester, photo satiné. Options de finition : pelliculage anti-UV, contrecollage sur support rigide (Dibond, Forex, carton plume), encadrement sur mesure.",
    faq: [
      { q: "Quelle est la différence entre affiche intérieur et extérieur ?", a: "Les affiches intérieur sont imprimées sur papier couché classique. Pour l'extérieur, nous utilisons des supports résistants à l'eau et aux UV (blue back, synthétique) avec un pelliculage de protection." },
      { q: "Puis-je faire imprimer une photo en poster grand format ?", a: "Oui ! Envoyez votre photo en haute résolution (300 dpi à taille réelle) et nous l'imprimons jusqu'au format B0. Pour les agrandissements, 150 dpi minimum suffisent." },
      { q: "Proposez-vous le contrecollage ?", a: "Oui, nous contrecollons vos affiches sur Dibond (aluminium), Forex (PVC expansé) ou carton plume pour un rendu rigide et professionnel, idéal pour la décoration ou l'exposition." },
    ],
  },
  "adhesif": {
    intro:
      "L'adhésif vinyle personnalisé est un support d'impression polyvalent qui s'adapte à toutes les surfaces : vitrines, véhicules, murs, sols, mobilier, signalétique. Chez J2L Print, nous imprimons vos stickers et adhésifs sur des vinyles professionnels avec des encres éco-solvant offrant une résistance exceptionnelle aux UV, à l'eau et aux rayures. Du petit autocollant promotionnel au covering complet de véhicule, nous maîtrisons toutes les dimensions.",
    useCases:
      "Vitrophanie pour devanture de magasin, lettrage de véhicule utilitaire, signalétique directionnelle, décoration murale, stickers produit, étiquettes adhésives, marquage au sol événementiel… l'adhésif vinyle offre des possibilités créatives infinies. Nos vinyles sont disponibles en finition brillante, mate, satinée, transparente ou micro-perforée (one-way vision pour vitrines).",
    quality:
      "Impression sur vinyle monomère (usage temporaire 1-3 ans) ou polymère (usage longue durée 5-7 ans). Épaisseur 80 à 100 microns avec liner de protection. Découpe au traceur numérique pour des contours précis, y compris les formes complexes. Pelliculage de protection anti-UV et anti-rayures disponible pour les applications extérieures intensives.",
    faq: [
      { q: "Quelle est la durée de vie d'un adhésif extérieur ?", a: "Un vinyle polymère avec pelliculage de protection dure 5 à 7 ans en extérieur, même exposé au soleil direct. Pour un usage temporaire (événement, promotion), un vinyle monomère suffit et offre 1 à 3 ans de tenue." },
      { q: "L'adhésif est-il repositionnable ?", a: "Nous proposons des vinyles à colle repositionnable pour les applications temporaires. Pour les usages permanents, nos vinyles à colle définitive garantissent une adhérence maximale sur toutes surfaces lisses." },
      { q: "Pouvez-vous découper mon adhésif à une forme personnalisée ?", a: "Oui, notre découpe numérique permet de réaliser toutes les formes : ronde, ovale, forme de logo, lettrage découpé… Envoyez-nous votre fichier vectoriel pour un devis." },
    ],
  },
  "panneau": {
    intro:
      "Le panneau rigide imprimé est la solution idéale pour la signalétique, l'affichage publicitaire durable et la décoration professionnelle. Imprimé directement sur support rigide (Dibond, Forex, Akylux, PVC) ou contrecollé, il offre un rendu impeccable et une tenue dans le temps incomparable. J2L Print propose l'impression directe UV sur panneau pour des couleurs intenses et une résistance optimale aux intempéries.",
    useCases:
      "Enseignes de magasin, panneaux de chantier, signalétique directionnelle, PLV (publicité sur lieu de vente), panneaux immobiliers, plaques professionnelles, décoration d'intérieur sur aluminium… le panneau rigide est adapté à une multitude d'applications intérieures et extérieures. Formats disponibles du A4 au 300x200 cm.",
    quality:
      "Impression UV directe à plat en 1440 dpi sur Dibond (aluminium composite 3 mm), Forex (PVC expansé 3-10 mm), Akylux (polypropylène alvéolaire), Plexiglas ou carton plume. Découpe sur mesure au millimètre, perçage pour fixation, angles arrondis sur demande. Nos panneaux Dibond résistent aux intempéries et conservent leurs couleurs pendant plus de 5 ans en extérieur.",
    faq: [
      { q: "Quel support choisir pour un usage extérieur ?", a: "Le Dibond (aluminium composite) est le support de référence pour l'extérieur : rigide, léger, indéformable et résistant aux intempéries. Pour un usage temporaire, l'Akylux est économique et recyclable." },
      { q: "Comment fixer mon panneau ?", a: "Plusieurs options : vis et chevilles (nous pouvons pré-percer), entretoises décoratives en inox, rails de fixation, adhésif double-face haute performance. Contactez-nous pour un conseil personnalisé." },
      { q: "Proposez-vous l'impression recto-verso ?", a: "Oui, l'impression recto-verso est disponible sur Dibond et Forex. Idéal pour les panneaux suspendus visibles des deux côtés." },
    ],
  },
  "t-shirt": {
    intro:
      "Le t-shirt personnalisé est un vecteur de communication puissant pour les entreprises, associations, événements sportifs et collectivités. Chez J2L Print, nous personnalisons vos textiles par sérigraphie, impression numérique DTG (Direct-to-Garment), flocage ou broderie selon vos besoins et quantités. Nos t-shirts sont sélectionnés parmi les meilleures marques textiles (Fruit of the Loom, Gildan, Stanley/Stella) pour un confort optimal et une durabilité au lavage.",
    useCases:
      "Uniformes d'entreprise, tenues d'équipe sportive, merchandising pour artistes et marques, t-shirts événementiels (festivals, marathons, séminaires), cadeaux d'entreprise personnalisés… Le t-shirt personnalisé fédère et communique. Disponible en coton bio, polyester technique, coton peigné premium, dans toutes les tailles (enfant à 5XL) et plus de 50 coloris.",
    quality:
      "Sérigraphie pour les grandes séries (à partir de 50 pièces) avec des encres plastisol résistantes à plus de 60 lavages. Impression DTG pour les petites quantités et les visuels photo réalistes. Flocage et flex pour les noms et numéros. Broderie jusqu'à 15 couleurs pour un rendu haut de gamme et durable. Chaque textile est contrôlé individuellement avant expédition.",
    faq: [
      { q: "Quelle technique choisir pour mon t-shirt ?", a: "Sérigraphie pour les grandes quantités (meilleur prix unitaire), DTG pour les petites séries et visuels complexes, broderie pour un rendu premium et durable. Notre équipe vous conseille selon votre projet." },
      { q: "Les impressions résistent-elles au lavage ?", a: "Oui, nos impressions sérigraphie et DTG résistent à plus de 60 lavages en machine à 40°C. La broderie est la technique la plus durable, résistant indéfiniment aux lavages." },
      { q: "Puis-je commander un échantillon ?", a: "Oui, nous réalisons des échantillons (BAT textile) avant le lancement de votre production. Contactez-nous pour recevoir un prototype." },
    ],
  },
  "mug": {
    intro:
      "Le mug personnalisé est un objet publicitaire incontournable : utile au quotidien, il garde votre marque sous les yeux de vos clients et collaborateurs à chaque pause café. J2L Print imprime vos mugs en sublimation haute définition pour des couleurs éclatantes et une résistance au lave-vaisselle. Du mug classique blanc au mug magique thermo-réactif, nous proposons une large gamme de modèles personnalisables.",
    useCases:
      "Cadeaux d'entreprise, goodies de salon professionnel, merchandising, objets promotionnels, cadeaux de fin d'année, produits dérivés pour associations… le mug personnalisé est toujours apprécié. Capacités de 250 ml à 450 ml, en céramique, verre, inox isotherme ou bambou éco-responsable.",
    quality:
      "Impression par sublimation thermique pour une image intégrée dans la matière, résistante au lave-vaisselle et au micro-ondes. Résolution photographique pour des visuels détaillés et des dégradés parfaits. Emballage individuel en boîte blanche ou coffret cadeau personnalisé disponible.",
    faq: [
      { q: "L'impression résiste-t-elle au lave-vaisselle ?", a: "Oui, notre technique de sublimation intègre l'encre dans la céramique. L'image ne s'efface pas, même après des centaines de cycles de lavage." },
      { q: "Quelle est la zone imprimable ?", a: "Sur un mug standard 330 ml, la zone imprimable est de 200x80 mm (impression panoramique). Nous proposons aussi l'impression intérieure et sur l'anse." },
      { q: "À partir de combien de pièces puis-je commander ?", a: "À partir d'un seul exemplaire ! Nos tarifs sont dégressifs : plus vous commandez, plus le prix unitaire diminue." },
    ],
  },
};

const GENERIC_DATA: ProductSEOData = {
  intro:
    "Faites confiance à J2L Print pour l'impression professionnelle de tous vos supports de communication. Notre imprimerie en ligne vous propose un large choix de produits personnalisables, imprimés avec des équipements dernière génération pour une qualité irréprochable. De la commande en ligne à la livraison, notre équipe vous accompagne à chaque étape pour garantir un résultat à la hauteur de vos attentes.",
  useCases:
    "Que vous soyez une entreprise, une association, une collectivité ou un particulier, nos produits s'adaptent à tous vos besoins de communication : événementiel, signalétique, promotion commerciale, décoration, identité visuelle. Commandez en ligne en toute simplicité, téléchargez votre fichier et recevez votre commande directement à votre adresse. Notre service client est disponible par téléphone et email pour répondre à toutes vos questions.",
  quality:
    "Impression numérique et offset de haute qualité, contrôle colorimétrique rigoureux, papiers et supports certifiés FSC/PEFC, encres éco-solvant et latex respectueuses de l'environnement. Chaque commande bénéficie d'une vérification gratuite de vos fichiers (résolution, fonds perdus, mode colorimétrique CMJN) pour éviter toute mauvaise surprise à la réception.",
  faq: [
    { q: "Comment passer commande ?", a: "Sélectionnez votre produit, configurez vos options (format, quantité, finition), téléchargez votre fichier et validez votre panier. Votre commande est produite et expédiée sous 3 à 5 jours ouvrés." },
    { q: "Quels formats de fichiers acceptez-vous ?", a: "Nous acceptons les fichiers PDF (recommandé), JPEG, PNG et TIFF en haute résolution (300 dpi minimum). Les fichiers doivent être en mode CMJN avec 2 mm de fonds perdus." },
    { q: "Proposez-vous un service de création graphique ?", a: "Oui, notre studio graphique réalise vos maquettes à partir de 65 € HT. Envoyez-nous votre brief, vos textes et vos logos, nous vous proposons un visuel sous 48h." },
  ],
};

/**
 * Find the best matching SEO data for a given product name/SKU.
 */
export function getProductSEOData(productName: string, sku?: string): ProductSEOData {
  const search = `${productName} ${sku || ""}`.toLowerCase();

  // Try each keyword
  for (const [keyword, data] of Object.entries(KEYWORD_MAP)) {
    if (search.includes(keyword)) {
      return data;
    }
  }

  // Extended keyword aliases
  const aliases: Record<string, string> = {
    "kakemono": "roll-up",
    "totem": "roll-up",
    "enrouleur": "roll-up",
    "drapeau": "banner",
    "banderole": "banner",
    "bâche": "banner",
    "bache": "banner",
    "dépliant": "flyer",
    "depliant": "flyer",
    "tract": "flyer",
    "prospectus": "flyer",
    "brochure": "flyer",
    "visite": "carte",
    "business card": "carte",
    "poster": "affiche",
    "sticker": "adhesif",
    "vinyle": "adhesif",
    "vitrophanie": "adhesif",
    "autocollant": "adhesif",
    "etiquette": "adhesif",
    "enseigne": "panneau",
    "plaque": "panneau",
    "dibond": "panneau",
    "forex": "panneau",
    "akylux": "panneau",
    "plv": "panneau",
    "textile": "t-shirt",
    "polo": "t-shirt",
    "sweat": "t-shirt",
    "veste": "t-shirt",
    "broderie": "t-shirt",
    "gobelet": "mug",
    "tasse": "mug",
    "gourde": "mug",
    "goodies": "mug",
    "stylo": "mug",
    "sac": "mug",
    "lampe": "roll-up",
    "spot": "roll-up",
    "comptoir": "roll-up",
  };

  for (const [alias, keyword] of Object.entries(aliases)) {
    if (search.includes(alias)) {
      return KEYWORD_MAP[keyword] || GENERIC_DATA;
    }
  }

  return GENERIC_DATA;
}
