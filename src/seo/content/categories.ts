// Unique editorial content for the 8 top categories.
// Each entry is genuinely distinct — no name-swapped duplication.
import type { ContentSection, FaqItem } from "../types";

export interface CategoryContent {
  /** matches product_categories.slug */
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  sections: ContentSection[];
  faq: FaqItem[];
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  "impression-papier": {
    slug: "impression-papier",
    name: "Impression papier",
    title: "Impression papier professionnelle en ligne",
    description:
      "Flyers, dépliants, cartes de visite, brochures et affiches imprimés sur papier de qualité, avec finitions au choix et livraison partout en France.",
    h1: "Impression papier pour les professionnels",
    intro: [
      "L'impression papier reste le socle de toute communication d'entreprise : un flyer bien conçu, une carte de visite soignée ou une brochure structurée portent votre message bien au-delà de l'écran. J2L Print regroupe ici l'ensemble des supports papier, du tirage unitaire aux grandes séries.",
      "Chaque produit est calibré pour un rendu fidèle : choix du grammage, du type de papier (couché, offset, recyclé) et des finitions (pelliculage mat ou brillant, vernis sélectif). Vous configurez, nous imprimons, vous êtes livré.",
    ],
    sections: [
      {
        heading: "Formats et supports disponibles",
        paragraphs: [
          "Du format poche au A3, sur papier 135 g à 350 g, vous trouverez le support adapté à chaque usage : diffusion en masse, prospection ou document de référence.",
        ],
        bullets: [
          "Flyers et dépliants A6, A5, A4 (plis roulé, accordéon, portefeuille)",
          "Cartes de visite standard, carrées ou à bords arrondis",
          "Brochures et catalogues piqués ou dos carré collé",
          "Affiches d'intérieur jusqu'au A0",
        ],
      },
      {
        heading: "Bien choisir son papier et ses finitions",
        paragraphs: [
          "Un grammage élevé inspire confiance pour une carte de visite ou un menu ; un papier plus léger reste idéal pour la distribution de flyers en volume. Le pelliculage mat valorise les visuels sobres, le brillant fait ressortir les couleurs vives.",
        ],
      },
      {
        heading: "Usages professionnels",
        bullets: [
          "Prospection commerciale et boîtage",
          "Supports d'accueil et points de vente",
          "Documentation produit et présentations",
          "Événements, salons et lancements",
        ],
      },
    ],
    faq: [
      {
        q: "Quel grammage choisir pour des flyers ?",
        a: "Pour des flyers de distribution, un papier 135 à 170 g offre un bon équilibre coût/tenue. Pour un document plus premium, optez pour 250 à 350 g.",
      },
      {
        q: "Puis-je commander une petite quantité ?",
        a: "Oui, de nombreux produits papier sont disponibles dès de faibles quantités, le prix unitaire diminuant à mesure que le tirage augmente.",
      },
      {
        q: "Le fichier doit-il intégrer des fonds perdus ?",
        a: "Oui, prévoyez 3 mm de fonds perdus et exportez en PDF CMJN pour un rendu conforme à l'impression.",
      },
    ],
  },

  "publicite-exterieure": {
    slug: "publicite-exterieure",
    name: "Publicité extérieure",
    title: "Publicité extérieure : supports grand format résistants",
    description:
      "Bâches, panneaux, kakémonos et signalétique extérieure conçus pour résister aux intempéries et capter l'attention en milieu urbain.",
    h1: "Publicité extérieure et signalétique",
    intro: [
      "La publicité extérieure travaille pour vous 24 h/24, sur la façade d'un commerce, le long d'un chantier ou à l'entrée d'un salon. Ces supports doivent rester lisibles à distance et tenir face au vent, à la pluie et aux UV.",
      "Nous proposons des matériaux pensés pour l'extérieur : encres résistantes, œillets renforcés et impressions haute densité qui conservent leurs couleurs dans le temps.",
    ],
    sections: [
      {
        heading: "Des supports faits pour durer dehors",
        bullets: [
          "Bâches PVC avec œillets pour façades et clôtures",
          "Panneaux rigides (Akilux, Dibond) pour la signalétique",
          "Kakémonos et drapeaux pour événements extérieurs",
          "Adhésifs vitrine et marquage de devanture",
        ],
      },
      {
        heading: "Lisibilité et impact à distance",
        paragraphs: [
          "Un message extérieur se lit en quelques secondes : privilégiez un titre court, un fort contraste et une typographie épaisse. La taille des caractères doit être proportionnelle à la distance de lecture.",
        ],
      },
    ],
    faq: [
      {
        q: "Les bâches résistent-elles à la pluie ?",
        a: "Oui, le PVC et les encres utilisées sont conçus pour un usage extérieur prolongé, y compris sous la pluie et le soleil.",
      },
      {
        q: "Comment fixer un panneau ou une bâche ?",
        a: "Les bâches sont livrées avec œillets pour tendeurs ou colliers ; les panneaux rigides se vissent ou se posent sur structure selon le support choisi.",
      },
    ],
  },

  "publicite-interieure": {
    slug: "publicite-interieure",
    name: "Publicité intérieure",
    title: "Publicité intérieure : PLV et supports de point de vente",
    description:
      "Roll-up, affiches, présentoirs et PLV pour animer vos espaces intérieurs, salons et points de vente avec un rendu net et soigné.",
    h1: "Publicité intérieure et PLV",
    intro: [
      "À l'intérieur, la communication se joue sur la finesse du rendu et la mise en scène de l'espace. Un roll-up bien placé, une affiche nette ou un présentoir soigné guident le regard et renforcent votre image.",
      "Ces supports privilégient la qualité d'impression et la facilité de montage, pour être déployés rapidement en boutique, en agence ou sur un stand.",
    ],
    sections: [
      {
        heading: "Animer un espace ou un stand",
        bullets: [
          "Roll-up et enrouleurs avec sac de transport",
          "Affiches intérieures haute définition",
          "Présentoirs et PLV carton",
          "Panneaux légers pour accueil et salles de réunion",
        ],
      },
      {
        heading: "Montage rapide et réutilisable",
        paragraphs: [
          "La plupart des supports intérieurs se montent sans outil et se transportent facilement, ce qui les rend parfaits pour les équipes commerciales et les événements récurrents.",
        ],
      },
    ],
    faq: [
      {
        q: "Un roll-up est-il réutilisable ?",
        a: "Oui, l'enrouleur se déploie et se range en quelques secondes ; seule la toile imprimée peut éventuellement être remplacée.",
      },
      {
        q: "Quelle résolution pour une affiche intérieure ?",
        a: "Visez 150 dpi à taille réelle pour un rendu net en lecture rapprochée.",
      },
    ],
  },

  "etiquettes-stickers": {
    slug: "etiquettes-stickers",
    name: "Étiquettes & Stickers",
    title: "Étiquettes et stickers personnalisés",
    description:
      "Étiquettes adhésives, stickers et autocollants découpés à la forme, sur supports papier ou vinyle, pour produits, emballages et marquage.",
    h1: "Étiquettes et stickers sur mesure",
    intro: [
      "L'étiquette est souvent le dernier point de contact avant l'achat : elle habille un produit, scelle un emballage ou diffuse un logo. Bien conçue, elle prolonge votre identité jusque dans la main du client.",
      "Du sticker rond au rouleau d'étiquettes, choisissez la matière, la forme de découpe et le type d'adhésif selon l'usage : intérieur, extérieur, alimentaire ou repositionnable.",
    ],
    sections: [
      {
        heading: "Matières et découpes",
        bullets: [
          "Étiquettes papier pour pots, bocaux et coffrets",
          "Vinyle blanc ou transparent pour l'extérieur",
          "Découpe à la forme selon votre logo",
          "Planches ou rouleaux pour la pose en série",
        ],
      },
      {
        heading: "Choisir le bon adhésif",
        paragraphs: [
          "Un adhésif permanent convient au marquage durable, tandis qu'un adhésif repositionnable facilite la pose sur vitrine. Pour le contact alimentaire ou l'humidité, le vinyle reste le plus fiable.",
        ],
      },
    ],
    faq: [
      {
        q: "Les stickers résistent-ils à l'eau ?",
        a: "Les stickers en vinyle sont résistants à l'eau et adaptés à un usage extérieur ; les étiquettes papier sont plutôt destinées à un usage intérieur.",
      },
      {
        q: "Peut-on découper à la forme de mon logo ?",
        a: "Oui, la découpe à la forme suit le contour de votre visuel pour un rendu sur mesure.",
      },
    ],
  },

  "emballages-sacs": {
    slug: "emballages-sacs",
    name: "Emballages & Sacs",
    title: "Emballages et sacs personnalisés",
    description:
      "Sacs papier, boîtes et emballages personnalisés à votre marque pour valoriser vos produits et soigner l'expérience de remise client.",
    h1: "Emballages et sacs à votre marque",
    intro: [
      "L'emballage transforme un simple achat en expérience de marque. Un sac papier élégant ou une boîte personnalisée prolongent la relation client bien après le point de vente et deviennent un support de communication mobile.",
      "Personnalisez vos contenants à vos couleurs, votre logo et vos finitions pour une remise produit cohérente avec votre image.",
    ],
    sections: [
      {
        heading: "Des contenants qui portent votre image",
        bullets: [
          "Sacs papier avec poignées torsadées ou plates",
          "Boîtes et coffrets personnalisés",
          "Emballages pour la vente à emporter",
          "Papiers de soie et accessoires de calage",
        ],
      },
      {
        heading: "Un levier d'image durable",
        paragraphs: [
          "Réutilisés et transportés, les sacs et emballages personnalisés circulent dans la ville et exposent votre marque à de nouveaux regards, tout en valorisant une démarche soignée.",
        ],
      },
    ],
    faq: [
      {
        q: "Quel sac choisir pour une boutique ?",
        a: "Un sac papier kraft à poignées torsadées offre une bonne tenue ; le pelliculage mat apporte une finition plus premium.",
      },
      {
        q: "Peut-on imprimer sur les deux faces ?",
        a: "Oui, l'impression recto/verso est possible pour exploiter toute la surface du sac ou de la boîte.",
      },
    ],
  },

  "objets-publicitaires-cadeaux": {
    slug: "objets-publicitaires-cadeaux",
    name: "Objets publicitaires & Cadeaux",
    title: "Objets publicitaires et cadeaux d'entreprise",
    description:
      "Goodies, cadeaux d'affaires et objets publicitaires personnalisés pour fidéliser vos clients et marquer les esprits lors de vos événements.",
    h1: "Objets publicitaires et cadeaux d'entreprise",
    intro: [
      "Un objet publicitaire utile reste sous les yeux de son destinataire pendant des mois : stylo, mug, tote bag ou carnet deviennent des rappels quotidiens de votre marque. C'est l'un des supports au meilleur taux de mémorisation.",
      "Sélectionnez des objets en phase avec votre public et personnalisez-les avec votre logo pour un cadeau d'entreprise qui a du sens.",
    ],
    sections: [
      {
        heading: "Des goodies qui restent",
        bullets: [
          "Stylos, mugs et gourdes personnalisés",
          "Tote bags et accessoires du quotidien",
          "Carnets et objets de bureau",
          "Cadeaux d'affaires pour fêtes et événements",
        ],
      },
      {
        heading: "Choisir un objet pertinent",
        paragraphs: [
          "Le meilleur goodie est celui qui sera réellement utilisé. Privilégiez l'utilité et la qualité plutôt que la quantité : un objet durable valorise davantage votre marque qu'un gadget vite oublié.",
        ],
      },
    ],
    faq: [
      {
        q: "À partir de quelle quantité commander ?",
        a: "Les objets publicitaires se commandent généralement par lots ; le coût unitaire diminue fortement avec le volume.",
      },
      {
        q: "Le marquage du logo est-il en couleur ?",
        a: "Selon l'objet et la technique de marquage, l'impression peut être monochrome ou en quadrichromie.",
      },
    ],
  },

  "textiles-accessoires": {
    slug: "textiles-accessoires",
    name: "Textiles & Accessoires",
    title: "Textiles personnalisés et accessoires",
    description:
      "T-shirts, polos, sweats et accessoires textiles personnalisés à votre logo pour vos équipes, événements et boutiques.",
    h1: "Textiles personnalisés pour entreprises et équipes",
    intro: [
      "Le textile personnalisé fédère une équipe et transforme chaque collaborateur en ambassadeur de marque. T-shirts d'événement, polos d'accueil ou sweats de staff renforcent le sentiment d'appartenance et la visibilité.",
      "Choisissez vos coupes, vos coloris et votre technique de marquage pour un rendu adapté à l'usage : port quotidien, événementiel ou revente.",
    ],
    sections: [
      {
        heading: "Habiller vos équipes et vos événements",
        bullets: [
          "T-shirts et polos personnalisés",
          "Sweats et vestes pour le staff",
          "Casquettes et accessoires textiles",
          "Tenues d'accueil et d'événement",
        ],
      },
      {
        heading: "Marquage adapté au support",
        paragraphs: [
          "La sérigraphie convient aux grandes séries d'un même visuel, la broderie apporte une finition haut de gamme sur polos et casquettes, tandis que le transfert permet des visuels détaillés en petites quantités.",
        ],
      },
    ],
    faq: [
      {
        q: "Broderie ou impression ?",
        a: "La broderie est idéale pour les logos sur polos et casquettes ; l'impression convient mieux aux visuels larges et détaillés sur t-shirts.",
      },
      {
        q: "Les tailles sont-elles modulables dans une commande ?",
        a: "Oui, vous pouvez généralement répartir les tailles au sein d'une même commande selon vos besoins.",
      },
    ],
  },

  "panneaux-baches-vinyles-toiles": {
    slug: "panneaux-baches-vinyles-toiles",
    name: "Panneaux, Bâches, Vinyles & Toiles",
    title: "Panneaux, bâches, vinyles et toiles imprimés",
    description:
      "Panneaux rigides, bâches grand format, adhésifs vinyle et toiles décoratives imprimés haute définition pour la signalétique et la décoration.",
    h1: "Panneaux, bâches, vinyles et toiles grand format",
    intro: [
      "Cette catégorie réunit les supports grand format les plus polyvalents : du panneau rigide qui structure une signalétique au vinyle adhésif qui habille une vitrine, en passant par la toile décorative qui personnalise un intérieur.",
      "Chaque matière a sa logique : rigidité pour la signalétique, souplesse pour les bâches, finesse d'adhérence pour le vinyle. Nous vous aidons à choisir selon le support et la durée d'exposition.",
    ],
    sections: [
      {
        heading: "Choisir la bonne matière",
        bullets: [
          "Panneaux Dibond et Akilux pour la signalétique durable",
          "Bâches PVC tendues pour les grands visuels",
          "Vinyles adhésifs pour vitrines, murs et véhicules",
          "Toiles tendues sur châssis pour la décoration",
        ],
      },
      {
        heading: "Pose intérieure ou extérieure",
        paragraphs: [
          "Pour l'extérieur, privilégiez les matières et encres résistantes aux UV ; en intérieur, la priorité va à la finesse du rendu et à la discrétion des fixations. La surface à couvrir et le recul de lecture orientent le choix du format.",
        ],
      },
    ],
    faq: [
      {
        q: "Quelle différence entre Dibond et Akilux ?",
        a: "Le Dibond est un panneau aluminium rigide et durable, idéal pour une signalétique pérenne ; l'Akilux, alvéolaire et plus léger, convient aux usages temporaires et économiques.",
      },
      {
        q: "Le vinyle s'enlève-t-il sans trace ?",
        a: "Les adhésifs monomères s'enlèvent facilement pour une pose courte ; pour une pose longue durée, un vinyle coulé est plus adapté.",
      },
    ],
  },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_CONTENT);
