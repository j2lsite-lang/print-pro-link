// Editorial content for the 4 service landing pages, mirrored faithfully
// from the existing published React routes (src/pages/ImpressionNumerique,
// GrandFormat, SupportsPublicitaires, Personnalisation). No invented data:
// titles, descriptions, H1 and product lists come straight from those pages.
import type { FaqItem } from "../types";

export interface ServiceContent {
  slug: string;          // route path segment, e.g. "impression-numerique"
  name: string;          // breadcrumb label
  title: string;         // matches the React route useSEO title
  description: string;   // matches the React route useSEO description
  h1: string;            // matches the React route <h1>
  intro: string[];       // hero paragraph(s)
  solutionsHeading: string;
  solutions: string[];   // product cards "Title — desc"
  closing?: string[];    // extra real paragraphs
  faq?: FaqItem[];
}

export const SERVICE_CONTENT: ServiceContent[] = [
  {
    slug: "impression-numerique",
    name: "Impression numérique",
    title:
      "Impression numérique en ligne – Flyers, cartes de visite, affiches | J2L Print",
    description:
      "Impression numérique professionnelle : flyers, cartes de visite, dépliants, affiches, brochures. Qualité offset et numérique, livraison rapide partout en France. Devis gratuit.",
    h1: "Impression numérique professionnelle en ligne",
    intro: [
      "J2L Print vous propose un service d'impression numérique haut de gamme pour tous vos supports de communication. De la carte de visite au dépliant grand tirage, nous imprimons vos documents avec une qualité irréprochable et une livraison rapide partout en France.",
    ],
    solutionsHeading: "Nos produits d'impression numérique",
    solutions: [
      "Cartes de visite — formats standard et personnalisés, papiers premium (couché, texturé, mat, brillant), finitions luxe.",
      "Flyers & dépliants — A5, A4, DL, formats spéciaux. Impression recto-verso, plis roulés, accordéon, fenêtre.",
      "Affiches & posters — de A3 à B0, papier couché ou photo. Idéal pour vitrine, événement ou décoration.",
      "Brochures & catalogues — piqûre à cheval, dos carré collé, reliure spirale. Jusqu'à 200 pages.",
      "Papeterie entreprise — têtes de lettre, enveloppes, chemises à rabats, blocs-notes personnalisés.",
      "Faire-part & invitations — mariages, naissances, événements. Papiers texturés, dorure à chaud, découpe laser.",
    ],
    closing: [
      "L'impression numérique est idéale pour les petites et moyennes séries (de 1 à 5 000 exemplaires) : mise en route rapide, pas de frais de plaque, personnalisation possible. Pour les grands tirages (5 000 exemplaires et plus), l'impression offset offre un coût unitaire dégressif et un large choix de papiers et finitions.",
    ],
    faq: [
      { q: "Quels formats et papiers sont disponibles pour l'impression numérique ?", a: "Nous proposons des formats du A7 au B0 sur papiers couchés mats, brillants, satinés, recyclés, texturés et premium. Les cartes de visite disposent également de finitions luxe : vernis sélectif, dorure, découpe laser." },
      { q: "Quel délai de livraison pour une impression numérique ?", a: "La production standard est de 3 à 5 jours ouvrés selon le produit et la quantité. Une option express est disponible sur devis pour les besoins urgents." },
      { q: "Puis-je recevoir un bon à tirer avant production ?", a: "Oui. Un BAT numérique est envoyé systématiquement par email pour validation avant lancement de l'impression. Un BAT physique est possible sur demande." },
    ],
  },
  {
    title:
      "Impression grand format – Bâches, banderoles, adhésifs, kakémonos | J2L Print",
    description:
      "Impression grand format professionnelle : bâches, banderoles, adhésifs, kakémonos, enseignes. Haute résolution 1440 dpi, livraison rapide partout en France. Devis gratuit.",
    h1: "Impression grand format en ligne",
    intro: [
      "J2L Print réalise tous vos supports de communication grand format : bâches publicitaires, banderoles, adhésifs, kakémonos et enseignes. Impression haute résolution jusqu'à 1440 dpi sur tous types de supports, livrée partout en France.",
    ],
    solutionsHeading: "Nos produits grand format",
    solutions: [
      "Bâches publicitaires — PVC 500g/m², micro-perforées, mesh. Finitions œillets, ourlets, fourreau. Toutes dimensions.",
      "Banderoles & calicots — impression recto ou recto-verso. Idéal pour façades, événements sportifs et culturels.",
      "Adhésifs & vinyles — sol, vitrine, véhicule, mur. Vinyles polymères longue durée, laminés anti-UV et anti-rayures.",
      "Kakémonos & roll-ups — structures auto-enroulantes, kakémonos suspendus. Transport facile, montage en 30 secondes.",
      "Enseignes & panneaux — Dibond, PVC expansé, Akilux, plexiglas. Découpe sur mesure, pose possible sur devis.",
      "Décoration murale — papier peint personnalisé, toiles tendues, panneaux acoustiques imprimés. Pour bureaux et commerces.",
    ],
  },
  {
    slug: "supports-publicitaires",
    name: "Supports publicitaires",
    title:
      "Supports publicitaires – Roll-ups, totems, PLV, signalétique | J2L Print",
    description:
      "Supports publicitaires professionnels : roll-ups, totems, PLV, comptoirs, signalétique intérieure et extérieure. Idéal salons, événements, points de vente. Livraison France.",
    h1: "Supports publicitaires & signalétique",
    intro: [
      "J2L Print conçoit et produit tous vos supports publicitaires pour salons professionnels, événements, points de vente et espaces d'accueil. Roll-ups, totems, PLV, comptoirs, drapeaux, tentes personnalisées — nous couvrons tous vos besoins de communication visuelle.",
    ],
    solutionsHeading: "Nos supports publicitaires",
    solutions: [
      "Roll-ups & enrouleurs — structures légères et transportables. Impression HD, changement de visuel possible. De 60 à 200 cm de large.",
      "Drapeaux & oriflammes — beach flags, voiles, flammes. Impression sublimation recto-verso. Résistants au vent et aux intempéries.",
      "Tentes & barnums — tentes pliantes personnalisées 3x3, 3x4.5, 3x6. Structure aluminium, impression toile complète.",
      "Totems & colonnes — totems elliptiques, carrés, triangulaires. Éclairés ou non. Visibles de loin.",
      "Comptoirs d'accueil — comptoirs pliables avec impression graphique. Idéal pour accueil salon, inscription événement.",
      "PLV & présentoirs — chevalets, porte-brochures, displays carton, kakémonos. Mise en valeur de vos produits en magasin.",
    ],
  },
  {
    slug: "personnalisation",
    name: "Personnalisation",
    title:
      "Personnalisation textile & objets publicitaires – T-shirts, mugs, goodies | J2L Print",
    description:
      "Personnalisation textile et objets publicitaires : t-shirts, polos, sweats, mugs, stylos, clés USB, goodies. Marquage sérigraphie, broderie, transfert. Livraison France.",
    h1: "Personnalisation textile & objets publicitaires",
    intro: [
      "J2L Print personnalise vos textiles et objets publicitaires à l'image de votre entreprise. T-shirts, polos, sweats, vestes, mugs, stylos, clés USB, sacs, carnets — des milliers de produits personnalisables pour vos équipes, clients et événements.",
    ],
    solutionsHeading: "Nos produits personnalisables",
    solutions: [
      "T-shirts & polos — coton bio, polyester technique, coupe homme/femme/enfant. Marquage sérigraphie, transfert ou DTF.",
      "Sweats & vestes — sweats zippés, hoodies, softshells, polaires. Broderie ou impression, petites et grandes séries.",
      "Mugs & thermos — mugs céramique, thermos inox, gourdes. Impression sublimation haute qualité, lavable en machine.",
      "Stylos & papeterie — stylos bille, roller, feutres. Carnets, bloc-notes, agendas personnalisés à votre logo.",
      "Sacs & bagagerie — tote bags, sacs shopping, sacoches, valises. Impression sérigraphie ou numérique directe.",
      "High-tech & USB — clés USB, batteries externes, enceintes, supports téléphone. Gravure laser ou impression.",
    ],
    closing: [
      "Plusieurs techniques de marquage sont disponibles selon le support et la quantité : sérigraphie, broderie, transfert DTF / numérique et sublimation.",
    ],
  },
];

export const SERVICE_SLUGS = SERVICE_CONTENT.map((s) => s.slug);
