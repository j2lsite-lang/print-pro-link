/**
 * ============================================================================
 *  J2L Print — Cloudflare Worker SEO / Reverse Proxy
 * ============================================================================
 *  Rôle :
 *   - Sert le domaine canonique https://j2lprint.fr depuis l origine DNS Cloudflare
 *     origin.j2lprint.fr via cf.resolveOverride, sans repasser dans la route Worker.
 *   - Force HTTPS + redirige www -> apex (301).
 *   - Cache HTML / assets / sitemaps avec des TTL adaptés.
 *   - Réécrit le domaine d origine vers le domaine canonique dans le HTML.
 *   - Marque les pages SEO gérées (X-SEO-Managed) : villes, départements,
 *     régions, catégories, sous-catégories, services, thèmes et fiches produits.
 *   - Ne met jamais en cache les pages dynamiques (panier, compte, admin…).
 *   - AUCUN repli vers la page d'accueil : une URL gérée sert UNIQUEMENT son
 *     fichier prérendu /…/index.html ; si le fichier manque -> vraie 404.
 *
 *  Données SEO (synchronisées par scripts/seo/generate.ts) :
 *   - 599 villes
 *   - 101 départements
 *   - 18 régions
 *   - 4 services
 *   - 8 catégories / 47 sous-catégories
 *   - 14 thèmes
 *   - 940 fiches produits clientes (37 références techniques exclues)
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
 * 1. Configuration des domaines & des durées de cache (TTL en secondes)
 * ------------------------------------------------------------------------- */
const CANONICAL_HOST  = "j2lprint.fr";
const CANONICAL_ORIGIN = "https://j2lprint.fr";
const ORIGIN_HOST = "origin.j2lprint.fr";
// LOVABLE_ORIGIN_HOST retiré : provoquait une boucle de redirection (voir 7.2).
// const LOVABLE_ORIGIN_HOST = "print-pro-link.lovable.app";

const HTML_TTL  = 300;       // 5 minutes  — pages HTML
const ASSET_TTL = 31536000;  // 1 an       — assets immuables (hash dans le nom)
const XML_TTL   = 3600;      // 1 heure    — sitemaps & robots.txt

/* ----------------------------------------------------------------------------
 * 2. Référentiel géographique national
 * ------------------------------------------------------------------------- */
const CITIES = [
  "abbeville", "agde", "agen", "aix-en-provence", "aix-les-bains", "ajaccio", "albert", "albertville", "albi",
  "alencon", "ales", "algrange", "allonnes", "altkirch", "amberieu-en-bugey", "amboise", "amiens",
  "amneville", "angers", "anglet", "angouleme", "annecy", "annemasse", "annonay", "antibes", "antony",
  "arcachon", "argentan", "argenteuil", "arles", "arras", "asnieres-sur-seine", "aubagne", "aubenas",
  "aubervilliers", "aubusson", "auch", "aulnay-sous-bois", "auray", "aureilhan", "aurillac", "autun",
  "auxerre", "avignon", "avrille", "ay-champagne", "aytre", "baccarat", "bagneres-de-bigorre",
  "bagnols-sur-ceze", "baie-mahault", "bains", "bains-les-bains", "bandol", "bar-le-duc", "bar-sur-aube",
  "bar-sur-seine", "barr", "basse-terre", "bastia", "bayeux", "bayonne", "beaucaire", "beaucourt", "beaune",
  "beauvais", "behren-les-forbach", "belfort", "benfeld", "bergerac", "besancon", "betheny", "beziers",
  "biarritz", "biguglia", "biscarrosse", "bischheim", "bischwiller", "bitche", "blagnac", "blois", "bobigny",
  "bogny-sur-meuse", "bordeaux", "borgo", "boulay-moselle", "bouligny", "boulogne-billancourt",
  "boulogne-sur-mer", "bourg-en-bresse", "bourges", "bourgoin-jallieu", "bressuire", "brest", "briancon",
  "briey", "brioude", "brive-la-gaillarde", "brumath", "brunstatt-didenheim", "bruyeres", "bulgneville",
  "buxerolles", "caen", "cagnes-sur-mer", "cahors", "calais", "caluire-et-cuire", "calvi",
  "canet-en-roussillon", "cannes", "capavenir-vosges", "carcassonne", "carpentras", "castelnaudary",
  "castelsarrasin", "castres", "cavaillon", "cayenne", "ceret", "cergy", "cernay", "cesson-sevigne",
  "challans", "chalon-sur-saone", "chalons-en-champagne", "chamalieres", "chambery", "chamonix-mont-blanc",
  "champagney", "champigneulles", "champigny-sur-marne", "charleville-mezieres", "charmes", "chartres",
  "chateau-gontier", "chateau-gontier-sur-mayenne", "chateau-salins", "chateaudun", "chateauroux",
  "chatel-sur-moselle", "chatellerault", "chatenois", "chaumont", "chelles", "chenove", "cherbourg",
  "cherbourg-en-cotentin", "chevigny-saint-sauveur", "chinon", "cholet", "clermont-ferrand", "clichy",
  "clouange", "cluses", "cognac", "colmar", "colombes", "colomiers", "commercy", "compiegne", "concarneau",
  "condom", "confolens", "contrexeville", "corbeil-essonnes", "corcieux", "cormontreuil", "cornimont",
  "corte", "cosne-cours-sur-loire", "coulaines", "courbevoie", "cournon-d-auvergne", "couzeix", "creil",
  "creteil", "creutzwald", "darney", "dax", "decize", "delle", "descartes", "dieppe", "dieuze",
  "digne-les-bains", "dijon", "dinan", "dole", "dombasle-sur-meurthe", "dompaire", "douai", "draguignan",
  "drancy", "dreux", "dunkerque", "dzaoudzi", "echirolles", "eckbolsheim", "eloyes", "embrun", "ensisheim",
  "epernay", "epinal", "epinay-sur-seine", "erstein", "etain", "evreux", "evry-courcouronnes", "fameck",
  "faulquemont", "fecamp", "figeac", "firminy", "fismes", "flers", "fleurance", "fleury-les-aubrais",
  "florac", "florange", "foix", "forbach", "fort-de-france", "fougeres", "fraize", "frejus",
  "freyming-merlebach", "frouard", "fumay", "gaillac", "gap", "geispolsheim", "gerardmer", "givet", "golbey",
  "gourdon", "granges-aumontzey", "granville", "grasse", "gray", "grenoble", "guebwiller", "guenange",
  "gueret", "guilherand-granges", "habsheim", "hagondange", "haguenau", "hayange", "heillecourt", "hericourt",
  "herouville-saint-clair", "hoenheim", "homecourt", "honfleur", "hyeres", "illkirch-graffenstaden",
  "illzach", "isle", "issoire", "issoudun", "ivry-sur-seine", "jarville-la-malgrange", "joeuf", "joigny",
  "joinville", "joue-les-tours", "jussey", "kingersheim", "koungou", "kourou", "l-isle-jourdain",
  "la-baule-escoublac", "la-bresse", "la-chapelle-saint-luc", "la-defense", "la-fleche", "la-roche-sur-yon",
  "la-rochelle", "la-seyne-sur-mer", "la-souterraine", "lamarche", "lamballe-armor", "lanester", "langres",
  "lannion", "laon", "laval", "laxou", "le-ban-saint-martin", "le-blanc", "le-creusot", "le-gosier",
  "le-havre", "le-lamentin", "le-mans", "le-puy-en-velay", "le-robert", "le-tampon", "le-thillot", "le-tholy",
  "lens", "les-abymes", "les-ponts-de-ce", "les-sables-d-olonne", "les-sables-dolonne", "levallois-perret",
  "libourne", "lievin", "liffol-le-grand", "ligny-en-barrois", "lille", "limoges", "lingolsheim", "lisieux",
  "liverdun", "longwy", "lons-le-saunier", "lorient", "loudun", "lourdes", "louviers", "luce", "ludres",
  "lunel", "luneville", "lure", "lutterbach", "luxeuil-les-bains", "lyon", "macon", "maizieres-les-metz",
  "mamoudzou", "manosque", "mantes-la-jolie", "marange-silvange", "marly", "marmande", "marnay", "marseille",
  "martigues", "marvejols", "massy", "matoury", "mauriac", "maxeville", "mayenne", "mayenne-ville", "meaux",
  "melun", "mende", "merignac", "metz", "millau", "mirecourt", "moissac", "molsheim", "monistrol-sur-loire",
  "mont-de-marsan", "mont-saint-martin", "montargis", "montauban", "montbeliard", "montbrison", "montelimar",
  "monthureux-sur-saone", "montigny-les-metz", "montlucon", "montpellier", "montreuil", "morhange", "morlaix",
  "moulins", "mourmelon-le-grand", "moyeuvre-grande", "mulhouse", "mundolsheim", "munster", "muret", "nancy",
  "nanterre", "nantes", "narbonne", "neufchateau", "neuilly-sur-seine", "neuves-maisons", "nevers", "nice",
  "nimes", "niort", "nogent-haute-marne", "nogent-sur-seine", "noisy-le-grand", "nomexy", "nouzonville",
  "obernai", "olivet", "orange", "orleans", "ostwald", "oyonnax", "pamiers", "panazol", "paris", "parthenay",
  "pau", "perigueux", "perpignan", "pessac", "petite-rosselle", "pfastatt", "phalsbourg", "plerin",
  "plombieres-les-bains", "pointe-a-pitre", "poissy", "poitiers", "pompey", "pont-a-mousson",
  "pont-sainte-marie", "pontarlier", "pontault-combault", "pontivy", "pontoise", "port-sur-saone",
  "porto-vecchio", "privas", "propriano", "provencheres-et-colroy", "quimper", "rambervillers",
  "raon-l-etape", "reichshoffen", "reims", "remiremont", "rennes", "rethel", "revin", "reze", "ribeauville",
  "riedisheim", "riom", "rioz", "rixheim", "roanne", "rochefort", "rodez", "romans-sur-isere", "rombas",
  "romilly-sur-seine", "romorantin-lanthenay", "roubaix", "rouen", "royan", "rueil-malmaison",
  "sable-sur-sarthe", "saint-amand-montrond", "saint-andre-les-vergers", "saint-avold", "saint-brieuc",
  "saint-chamond", "saint-chely-d-apcher", "saint-claude", "saint-cyr-sur-loire", "saint-denis",
  "saint-denis-reunion", "saint-die-des-vosges", "saint-dizier", "saint-esteve", "saint-etienne",
  "saint-etienne-du-rouvray", "saint-flour", "saint-germain-en-laye", "saint-girons", "saint-herblain",
  "saint-jean-de-la-ruelle", "saint-junien", "saint-laurent-du-maroni", "saint-lo", "saint-louis",
  "saint-loup-sur-semouse", "saint-malo", "saint-martin-d-heres", "saint-maur-des-fosses", "saint-max",
  "saint-mihiel", "saint-nazaire", "saint-nicolas-de-port", "saint-paul", "saint-paul-reunion",
  "saint-pierre", "saint-pierre-des-corps", "saint-pierre-reunion", "saint-priest", "saint-quentin",
  "saint-raphael", "saint-sebastien-sur-loire", "sainte-marie-aux-mines", "sainte-menehould", "sainte-savine",
  "saintes", "salon-de-provence", "sanary-sur-mer", "sarcelles", "sarlat-la-caneda", "sarrebourg",
  "sarreguemines", "sartene", "sartrouville", "saulxures-sur-moselotte", "saumur", "sausheim", "saverne",
  "savigny-sur-orge", "schiltigheim", "schoelcher", "sedan", "selestat", "senlis", "senones", "sens", "sete",
  "sezanne", "sisteron", "soissons", "sotteville-les-rouen", "souffelweyersheim", "soultz-haut-rhin",
  "soyaux", "stenay", "stiring-wendel", "strasbourg", "talange", "talant", "talence", "tarbes", "thann",
  "thaon-les-vosges", "thionville", "thonon-les-bains", "thouars", "tinqueux", "tomblaine", "toul", "toulon",
  "toulouse", "tourcoing", "tournefeuille", "tours", "troyes", "tulle", "uckange", "ussel", "vagney",
  "valdoie", "valence", "valenciennes", "vandoeuvre-les-nancy", "vannes", "varennes-vauzelles", "vaucouleurs",
  "vaulx-en-velin", "vendenheim", "vendome", "venissieux", "ventron", "verdun", "vernon", "versailles",
  "vesoul", "vichy", "vienne", "vierzon", "villefranche-de-rouergue", "villenave-d-ornon",
  "villeneuve-d-ascq", "villeneuve-les-avignon", "villeneuve-sur-lot", "villers-les-nancy", "villerupt",
  "villeurbanne", "vincey", "vitre", "vitry-le-francois", "vitry-sur-seine", "vittel", "voiron", "vouziers",
  "vrigne-aux-bois", "wasselonne", "wassy", "wintzenheim", "wissembourg", "wittelsheim", "wittenheim",
  "woippy", "xertigny", "yssingeaux", "yutz"
];

const DEPARTMENTS = [
  "ain", "aisne", "allier", "alpes-de-haute-provence", "alpes-maritimes", "ardeche", "ardennes", "ariege",
  "aube", "aude", "aveyron", "bas-rhin", "bouches-du-rhone", "calvados", "cantal", "charente",
  "charente-maritime", "cher", "correze", "corse-du-sud", "cote-d-or", "cotes-d-armor", "creuse",
  "deux-sevres", "dordogne", "doubs", "drome", "essonne", "eure", "eure-et-loir", "finistere", "gard", "gers",
  "gironde", "guadeloupe", "guyane", "haut-rhin", "haute-corse", "haute-garonne", "haute-loire",
  "haute-marne", "haute-saone", "haute-savoie", "haute-vienne", "hautes-alpes", "hautes-pyrenees",
  "hauts-de-seine", "herault", "ille-et-vilaine", "indre", "indre-et-loire", "isere", "jura", "la-reunion",
  "landes", "loir-et-cher", "loire", "loire-atlantique", "loiret", "lot", "lot-et-garonne", "lozere",
  "maine-et-loire", "manche", "marne", "martinique", "mayenne", "mayotte", "meurthe-et-moselle", "meuse",
  "morbihan", "moselle", "nievre", "nord", "oise", "orne", "paris", "pas-de-calais", "puy-de-dome",
  "pyrenees-atlantiques", "pyrenees-orientales", "rhone", "saone-et-loire", "sarthe", "savoie",
  "seine-et-marne", "seine-maritime", "seine-saint-denis", "somme", "tarn", "tarn-et-garonne",
  "territoire-de-belfort", "val-d-oise", "val-de-marne", "var", "vaucluse", "vendee", "vienne", "vosges",
  "yonne", "yvelines"
];

const REGIONS = [
  "auvergne-rhone-alpes", "bourgogne-franche-comte", "bretagne", "centre-val-de-loire", "corse", "grand-est",
  "guadeloupe", "guyane", "hauts-de-france", "ile-de-france", "la-reunion", "martinique", "mayotte",
  "normandie", "nouvelle-aquitaine", "occitanie", "pays-de-la-loire", "provence-alpes-cote-d-azur"
];

// Thèmes / collections (slugs des pages /themes/:slug). Synchronisé par
// scripts/seo/generate.ts avec les thèmes prérendus.
const THEMES = ["coupe-du-monde-2026","easter","events","hospitality-industry","interior-and-decoration-theme","kit-du-supporter","new-and-updated","new-years-resolutions","office-theme","sale","summer-theme","sustainable","valentine","verkiezingsdrukwerk"];

/* ----------------------------------------------------------------------------
 * 3. Arborescence du catalogue : services, catégories & sous-catégories
 * ------------------------------------------------------------------------- */
const SERVICES = [
  "impression-numerique", "grand-format", "supports-publicitaires", "personnalisation"
];

const CATEGORIES = [
  "impression-papier", "publicite-exterieure", "publicite-interieure", "etiquettes-stickers",
  "emballages-sacs", "objets-publicitaires-cadeaux", "textiles-accessoires", "panneaux-baches-vinyles-toiles"
];

const SUBCATEGORIES = {
  "impression-papier": ["cartes-visite-enveloppes", "papeterie", "catering-restaurants", "brochures-magazines", "flyers-depliants-affiches", "calendriers", "courriers-creatifs"],
  "publicite-exterieure": ["stop-trottoirs-panneaux", "panneaux-accessoires-ext", "tonnelles-mobilier-exterieur", "drapeaux-beachflags-accessoires", "bannieres-structures-fixation"],
  "publicite-interieure": ["toiles-textiles-deco-interieure", "presentoirs-materiel-plv", "panneaux-accessoires-int", "stands-materiel-expo", "mobilier-interieur", "roll-ups"],
  "etiquettes-stickers": ["accessoires-autocollants", "petits-autocollants", "autocollants-grand-format", "rubans-adhesifs", "films-adhesifs-type", "autocollants-rouleaux"],
  "emballages-sacs": ["sacs-tote-bags", "emballages-alimentaires", "emballages-expedition", "emballages-cadeaux"],
  "objets-publicitaires-cadeaux": ["saisonnalite", "gadgets", "bien-etre", "nourriture-boissons", "articles-papeterie", "verrerie-vaisselle-gourdes", "general"],
  "textiles-accessoires": ["marquage-transferts-textiles", "accessoires", "textiles-bain", "cuisine-sejour", "vetements", "produits-bebes", "textiles-sport"],
  "panneaux-baches-vinyles-toiles": ["toiles-textiles", "films-adhesifs", "lookbooks", "panneaux-accessoires", "baches-banderoles"]
};

/* ----------------------------------------------------------------------------
 * 4. Produits Print.com (slugs des fiches /products/:slug)
 * ------------------------------------------------------------------------- */
const PRODUCTS = ["a-board-panel-clips","a-displays","abri-posters","acoustic-deskdividers","acoustic-filling","acoustic-hanging-frames","acoustic-roomdividers","acoustic-wall-frames","acrylic-photo-prints","adhesive-hanger","adhesive-magnet","aftersun-mousse","air-cushion-envelopes","airtex","alicante-bamboo-pen","alicante-metal-stylus-pen","all-over-laminated-stapled-magazines","all-over-laminated-wire-o-magazines","all-over-printed-envelopes","allegra-wine-glass-35cl","aluminium-floating-frames","aluminium-sport-bottle","aluminum-bottle-with-carabiner","aluminum-can-with-chocolate","aluminum-can-with-chocolate-eastern","aluminum-can-with-chocolate-large","americano","americano-cortado","americano-expresso","americano-medio","apple-elderberry-juice-200ml","apple-juice-200ml","apron-all-over","apron-basic-1","apron-denim-1","apron-premium-1","as-drinking-bottle","avery-rpet-drinking-bottle","backlit","backpacks","balloons","bamboo-skewer","bamboo-straw","bamboo-sunglasses","banner-flags","banner-frame","banner-pole-brackets","banners","banners-sign-lookbook","bar-aprons-long","bar-aprons-mid-length","bar-aprons-short","baseplate-side-textile-frame","baseplate-textile-frame","basic-advent-calendar","basic-cap","basic-key-ring","basic-m3l","basic-notebook","basic-pen-sen-soft","bath-mat","bathrobe","beach-balls","beach-tennis-set","beach-towels","beachflag-bags","beachflag-poles","beachflag-rotators","beachflags","beanbags","beer-crate","beer-mats","belo-isolated-bottle","bib-basic-1","big-towels","biond-vinyl","blackback","blanket-all-over-1","blanket-fleece-3","blind-banner-frame","blind-frame-banner","blisy-banner","blisy-frame","blocknotes","blueprints","board-backed-envelopes","boerke-beer-glass-33cl","bookmarks","books","bottle-opener","bottle-opener-key-ring","bottleopener-m3l","bounded-magazines","box2-rigid-lookbook","boxes-fefco-0201-digital","boxes_with_two_lids","brace-tumbler","bucket-hats","budget-pen-contour","budget-pen-contour-silver","bungee-cord","bunting-flags","bureau-calendar","burger-boxes","business-stationery","businesscard-boxes","businesscards","buttons","c-hooks","camelbak-chute","camelbak-chute-mag","camelbak-hot-cap","canvas","canvas-beach-bags","canvas-print","canvas-print-floating-frame","canvas-shopping-bags","canvas-tote-bags","cap-opener","car-stickers","carabiner-hook","carbon-copy-pads","carbon-copy-pads-loose","card-sets","card-sleeve-flipcover","cardboard-photo-frame","cardboard-roller-banners","cardboard-strut","cards-mail-lookbook","carpenter_pencil","carrying-trays","carwrap","ceiling-clip","ceiling-hanger","celebrations-box","ceramic-tiles","chalk-paper","change-card","childrens-safety-vest","choco-bar-easter","choco-chick-easter","choco-eggs-bag-easter","choco-eggs-box-easter","choco-eggs-jar-easter","choco-truffle-easter","chocolate-bar-large","chocolate-boxes","chocolate-christmas-sleeve","chocolate-heart-sleeve","chocolate-letter-sleeve","chocolate-mountain-cookies","chocolates","chopsticks","christmas-hats","christmas-sweater","christmas-tree-hanger","chromaluxe-metal-prints","chrome-pen-raja","chrome-pet-vinyl","chunky-knitted-scarf","cinnamon-stars","classic-drink-deckchair","classic-knitted-scarf","classico-longdrink-glass-32cl","clearview-vinyl","click-clack-can","clipboard-mdf","coaster-opener","coffee-cookies","coffee-paper-cups","coffee-sets","color-cap-flat-electronic","colored-envelope","colored-mug","colored_pencils","colour-mix-sunglasses","cone-bags","construction-fence-banners","consumption-vouchers","contour-extra-touch-pens","contour-hard-pen","contour-pen","cork-notebook","corrugated-cardboard","cotton-bags-drawstring","cotton-gymsac","cotton-notebook","cotton-strap-beach-bags","cotton-tote-bags-all-over","cotton-tote-bags-long","counters","covers-lookbook","cricket-original","cross-base-fiberglass-poles","cross-base-foldable","crowd-fence-banners","cube-boxes","cube-calendar","cube-notes","cushions","custom-banner","cutlery-pouches","deckchair","decotex","delivery-displays","deluxe-drinking-bottle","desk-month-calendar","desk-pads","dextro-energy","diaries","dibond","dibond-butler-finish","dibond-coating","directors-chair","dispa","display-board","display-cards","display-cube","display-standing","display-standing-triangle","display-triangle","disposable-rain-poncho","doming-stickers","door-hangers","dot-vinyl","double-knit-thinsulate-hats","double-sided-window-stickers","duo-deckchair","duo-knitted-scarf","duo-paraplu","duvet-covers","easels","easter-bunny-with-sleeve","easter-eggs","election-boards","election-flyers-fr","enamel-mug","energy-drink-250ml","envelopes-mail-lookbook","envelopes-with-side-fold","ersatz-paper","etched-glass-film","eve-pen","fabrics","facade-banner","facade-banner-system","facade-flags","facade-letters","facade-pole-holder","face-paint-stick","fairtrade-cotton-tote-bag","falconetti-paraplu-130","fan","fan-rainbow","fc-transfer","felt-bags-knotted-strings","felt-shopping-bags","felt-tote-bags","filled-gingerbread-heart","flag","flag-chain-weight","flag-counter-weight","flag-counter-weight-bar","flag-counter-weight-rotating-ring","flag-elastic-mast-strap","flag-fixers","flag-pet","flag-plastic-mast-strap","flag-skewer","flagclips","flat-cubes","flat-cut-letters","fleece-scarf","flexible-pvc","flexxs-application-set","flexxs-cleaner","flexxs-felt","flexxs-glue","flexxs-glue-heavy-spray","flexxs-primer","flexxs-sealer","flexxs-squeegee-straight-edge","flexxs-wallfinish","flip-covers","flip-flops","floor-decal","floor-mat-all-over","floor-vinyl","fluor-stickers","flyers","foam-board","foil-posters","foldable-banners","foldable-led-frames","folder-display","folders","folding-rulers","food-box","food-wrappers","foot-plates","forex","forex-black","forex-re","fragrance-sticks","framed-posters","free-standing-banner-frame","free-standing-led-frames","french-fries-boxes","frisbee","fruit-gummy","fruit-gummy-honey-bears","fruit-gummy-juice-bears","fruit-gummy-vegan-bears","fut-cards","garden-poster","garden-signs","geckotex","gibraltar-stackable-glass-30cl","gift-bag","gift-bag-bow","gift-wrapping","giftbox-with-lid","giftcard-holders","gingerbread-in-can","glacier-drinking-bottle","glass-bamboo-teabottle","glass-bottle","glass-water-bottle-330ml","glass-water-bottle-750ml","glove-touch","golfparaplu-windproof","grass-paper-notebook","ground-drill","ground-spike-fiberglass-poles","growing-paper-cards","growing-paper-envelopes","grs-pp-sunglasses","guest-towels","hammock-polycotton","hand-lotion","hand-lotion-bottle","hand-soap-bottle","handysticks","hanging-aluminum-frame","hanging-banners","hangtags","happy-hardcolor-pen","happy-pens","happy-pens-recycled","hardcolour-bar-pen","hardcover-books","hardcover-calendar","hd-metal-prints","headbands","heart-can","helsinki-rvs-bottle","hexagon-pen-holder","hexagon-spacers","high-quality-photo-acrylic","hinge-can","hockers","hockers-cardboard","holographic-stickers","holographic-wristbands","hoodie-basic-1","hoodie-basic-2","hoodie-basic-3","hoodie-basic-4","hoodie-basic-5","hoodie-basic-6","hoodie-budget-2","hoodie-budget-3","hoodie-budget-4","hoodie-budget-6","hoodie-budget-7","hoodie-budget-8","hoodie-premium-1","hoodie-premium-2","hoodie-premium-3","hoodie-premium-4","hoodie-premium-5","hoodie-premium-6","hoodie-premium-7","hoodie-premium-8","hoodie-premium-9","hpl-trespa","ice-cream-cups-flexo","ice-cream-cups-offset","ice-scraper-glove","ice-scraper-transparant","ice-scraper-triangle","indoor-carpet","induction-protectors","info-frames","info-stands","info-stands-deluxe","inhaker-caps-baseplate","inhaker-christmas-tree","inhaker-connectors","inhaker-demo-kit-prints","inhaker-folder-displays","inhaker-foot-plates","inhaker-hooks-adhesive-strip","inhaker-poles","inhaker-stand","inhaker-weft-caps","inspire-lookbook","insulated-stainless-steel-bottle","insulating-bottle-double-walled","interchangable-sling-deckchair","jbl-go-essential","jump-cubes","jute-bag-cotton","jute-bags","key-chain","key-ring-bottle-opener","key-ring-trolley-euro-token","kids-deckchair","kiosk-flag","knitted-hats-with-patch","label-dispenser","labels-on-roll","laminate-sign-lookbook","lamppost-signs","laptop-sleeve","laptop-sleeve-lining","latte-mug-small","led-frame-counters","led-frames","letterbox-box-with-lid","letterbox-toner","lifesizers","lightbox-posters","lintec-vinyl","lip-balm","longlife","loose-inserts-pavement-boards","luggage-tags","lunch-boxes","lunch-boxes-with-handle","luxe-metal-pen","luxurious-businesscards","luxurious-folder-displays","luxurious-postcards","luxury-paper-bag","luxury-paper-bag-duplex","luxury-paper-bag-recycled","luxury-paper-bag-screenprint","luxury-paper-bag-straw","luxury-paper-bag-studs","luxury-paper-bag-window","m-and-m-bag","magnet-foil","magnet-posters","magnetic-gift-boxes","magnetic-gift-boxes-handles","mail-lookbook","mailingbox-inkjet","maps","mats","matt-aluminium-pen","memory-cards","mentos-big-rolls","mentos-chewing-gum","mentos-rolls","menu-cover-bamboo","menu-cover-cava-wash","menu-cover-clipboard-leather","menu-cover-felt","menu-cover-leather","menu-cover-leather-premium","menu-cover-luxurious","menu-covers-washing-paper","menus","mepal-drinking-bottle","mesh","mesh-cap","metal-baseplate-fiberglass-poles","metal-baseplate-heavy-fiberglass-poles","metal-pen","micro-deckchair","mini-backpack","mini-magazines","minimax-opvouwbare-paraplu","month-calendars","mousepad-hardtop","mousepad-inserts","mugs","multiloft","multiloft-businesscards","namebadges","nameplate-holders","nameplates","napkin-airlaid","napkin-bamboo","napkin-tissue","napkin-wrapper","neon-posters","newspaper","non-woven-cooler-bags","non-woven-kraft-bag","non-woven-shoppingbag","notebook-canvas","notebook-felt","notebook-rpet-cover","nylon-spacers","nylon-spacers-glue","olive-oil","olive-salt-pepper-tubes","one-way-vision-vinyl","open-close-paraplu","oracal-colour-swatches","oreo-keks","original-knitted-hats","outdoor-carpet","outdoor-textile-stretcher-frames","panel-hanging-plates","paper-air-cushion-envelopes","paper-bag","paper-bag-flat-loop","paper-bag-flat-loop-digital","paper-bags-twisted-offset","paper-christmas-baubles","paper-coasters","paper-food-bag","paper-mailbag","paper-mailbag-inkjet","paper-sign-lookbook","paper-winebag-twisted","parasol","pavement-board","pavement-sign-posters","pavement-signs-a-board","pavement-signs-swing-base","pavement-signs-water-tank","pavement-signs-water-tank-premium","pe-grip-bottle","pen-apollo-hardcolor","pen-baron","pen-contour-rpet","pen-kific","pen-kific-r-abs","pen-senator-nature-plus","pen-senator-super-hit-eco","pencil-case","pencil_eraser","pencil_wood","peppermint-roll","perfax-brush","perfax-glue","perfax-knife","perfax-roller","perfax-seam-roller","perfax-spatula","personalised-wine-bottles","pes-outdoor","pet-felt","pet-felt-letters","pet-felt-mounting-kit","pet-felt-sample-chain","pet-felt-suspension-kits","pet-felt-wall-panels","photo-aluminium","photo-cardboard","photo-decotex","photo-dibond","photo-foamed-pvc","photo-poster","photo-stretcher-frame","photo-tiles","photo-wallpaper","picnic-blanket","pillow-packs","pillow-packs-kraft","pizza-slice-holders","placemats","plano-printsheets","plastic-bottle","plastic-drinkingbottle","plastic-water-bottle-330ml","plastic-water-bottle-500ml","plastic-wristbands","play-mat","playing-cards","plexiglass","poke-bowls","pole-flags","poles","polo-basic-2","polo-basic-4","polo-basic-5","polo-basic-6","polo-basic-7","polo-basic-8","polo-basic-9","polo-budget-1","polo-budget-2","polo-budget-3","polo-budget-4","polo-budget-5","polo-budget-6","polo-budget-7","polo-budget-9","polo-premium-2","polo-premium-3","polo-premium-4","polo-premium-5","polo-premium-6","polo-premium-7","polyester-beach-bags","polyester-gymsac","polyester-morf","polypropylene","polypropylene-insulation-mug","polystone-block-stand","polystyrene","pop-up-card","pop-up-house","popcorn-boxes","popup-wall","portable-electrical-fans","postcards","postcards-with-envelopes","poster-holders","posters","powerbank-bamboo","powerbank-basic","powerbank-solar","powerbank-wireless","pp-shopper","premium-advent-calendar","premium-key-ring","premium-socks","presentation-folders","prince-cookies","print-lookbook","print-lookbook-contents-only","printed-binder-filler","printed-envelopes","printed-fan-deck","printed-letterheads","printing-paper","product-display","promo-knitted-scarf","promotionroll","puzzles","puzzles-1000","pvc-510","pvc-610","pvc-cards","pyramid-corner-shelf","pyramid-display","quartet-cards","raffle-tickets","rally-shield","re-board","re-board-christmas","re-board-foot-plates","re-board-seasonal","real-estate-signs","real-estate-signs-flat","recycled-bag","recycled-cardboard-notebook","recycled-gymsac","recycled-leather-notebook","recycled-pu-notebook","refill-lookbook","reusable-cups","reusable-cups-all-over","reusable-hotcups","ribbon","ribbon-color-swatch","rigid-lookbook","ring-binders","roll-up-banner-light","roll-up-cassettes","roller-banners","rolltop-bags","romper-basic-1","romper-basic-2","roughmark-vinyl","round-tier-shelf","rpet-bamboo-bottle","rpet-notebook","rpet-sunglasses","ruler","rvs-bamboo-teabottle","rvs-bottle-bamboo-lid","rvs-bottle-double-walled","rvs-bottle-gloss","rvs-bottle-silk","rvs-straw","safety-vests","sample-bags-envelopes","satin-bag","scented-candles","seg-fabrics","segrollr","self-adhesive-posters","set-lookbooks","shelf-strips","shipping-boxes","shipping-boxes-digital","shipping-labels","shot-glasses-set","show-cards","sign-holder","sign-holder-deluxe","sign-lookbook","sign-lookbook-contents-only","silver-cap-flat-electronic","single-folder-displays","site-fence-banners","sky-dancers","skydancer-blower","skydancer-blower-cover","skydancer-led","sleeves","slider-boxes","slider-card","slipcases","smoothie-200ml","snack-boxes","snack-trays","snap-frame","snap-frames-colour","snap-frames-led","snap-frames-waterproof","snapback-cap","snowstar-hats","softshell-jacket-with-hood","softshell-morf","spacers","spandex-table-covers","special-print-lookbook","spine-labels","splashback","sport-shirt-basic-1","sport-shirt-basic-2","sport-shirt-budget-1","sport-shirt-budget-2","sport-shirt-premium-2","sport-towels","sports-bags","sports-field-board","sports-field-brackets","sports-wristbands","spunpolyester","square-peppermint-pack","squarefold-magazines","squeegee-felt-strip","stackable-mug","stackable-pos-displays","stainless-steel-bottle-insulated","stamps","stamps_colop_classic","stamps_colop_expert","stamps_colop_printer","stamps_trodat_printy","stamps_trodat_proffesional","stapled-magazines","stapled-wall-calendar","static-film","steel-plate-17","stick-flags","sticker-sheets","sticker-vinyl","stickers","sticky-notes","stormfix","sublimation-puzzles","sublimation-puzzles-heart-shaped","subyard-buckle","subyard-safety","subyard-safety-buckle","subyard-standard","suction-cup-hooks","suction-cup-windowflag-stick","suction-cup-with-thread","suitcase-peppermint-pack","sun-visor","sunglasses","sunglasses-flag","sunscreen","sunscreen-key-chain","suprafleece-scarf","surprise-boxes-chocolate","suspended-ceiling-magnets","suspension-set-canvas","sweater-basic-1","sweater-basic-2","sweater-basic-3","sweater-budget-2","sweater-budget-3","sweater-budget-4","sweater-budget-5","sweater-budget-7","sweater-budget-8","sweater-premium-1","sweater-premium-2","sweater-premium-3","sweater-premium-4","sweater-premium-5","sweater-premium-7","sweater-premium-8","t-shirt-basic-1","t-shirt-basic-3","t-shirt-basic-4","t-shirt-basic-5","t-shirt-basic-6","t-shirt-basic-7","t-shirt-basic-8","t-shirt-basic-9","t-shirt-basic-workwear-1","t-shirt-budget-1","t-shirt-budget-10","t-shirt-budget-3","t-shirt-budget-4","t-shirt-budget-5","t-shirt-budget-7","t-shirt-budget-8","t-shirt-budget-9","t-shirt-premium-1","t-shirt-premium-10","t-shirt-premium-11","t-shirt-premium-12","t-shirt-premium-13","t-shirt-premium-4","t-shirt-premium-5","t-shirt-premium-6","t-shirt-premium-7","t-shirt-premium-8","t-shirt-premium-9","table-flag","table-roll-up-banner","table-stands","tablecloth","tablecloth-indoor","tabs","tacx-shanti-500","tacx-shanti-750","tacx-shiva-500","tacx-shiva-750","tacx-shiva-o2-500","tacx-shiva-o2-750","tape","tea-tubes","tear-off-calendars","tear-resistant-stapled-magazines","telecard","telescopic-backdrops","telescopic-boxes","tent-heaters","tent-lighting","tent-weight-plates","textile-placemats","textile-stickers","textile-stretcher-a-boards","textile-stretcher-frames","textmarker","tic-tac-box","tic-tac-wrapped","tickets","tiewraps","tire-base","tissue-boxes","tissue-paper","top-boards-pavement-sign","torch-key-ring","torch-key-ring-bottle-opener","tote-bags-with-all-over-printing","totem-displays","towel","towel-all-over-1","trainings-vest","trainingsvest","travel-pillow","triaflex-banner","triaflex-frame","triple-basic-folder-display","triple-deluxe-folder-display","tritan-bottle","tritan-milkbottle","tritan-rvs-bottle","trolley","tubes-giftset","tumbler-tuesday","tumbler-with-flip-lid","tumbler-with-handle","tumbler-with-handle-stainless-steel","tyvek-wristbands","umbrella-base","umbrella-base-45","uncoated-print-lookbook","usb-hubs","usb-sticks-bamboo","usb-sticks-creditcard","usb-sticks-twister","vertical-pole-flags","vinga-drinking-bottle","vinyl-cut-letters","vinyl-sign-lookbook","vinyl-wristbands","wall-circles","wall-coverings-sign-lookbook","wall-graphics","wall-mount-beachflags","wall-mount-textile-frame","wall-signs","wallpaper","wallpaper-circles","wallpaper-samples","washcloth","water-bag","water-bag-black","water-bottle-infuser","water-cartons","waterproof-posters","whiteboard-kits","whiteboards-premium","window-curtains","window-flag","window-sticker","wine-bags","wine-cooler","wine-glasses","wine-hang-tags","wine-packaging","wine-set","wineboxes-basic-wood","wineboxes-corrugated","wineboxes-pet-felt","winter-deckchair","wire-o-desk-calendars","wire-o-magazines","wire-o-wall-calendar","wireless-speaker","with-compliment-cards","wobblers","wooden-block-stand","wooden-clip-pen","wooden-postcards","woven-wristbands","x-banner-system","x-banners","x-tens-banner","x-tens-frame","xl-deckchair","xxl-deckchair","yupo-vinyl","z-folds","zipped-hoodie-basic-1","zipped-hoodie-basic-2","zipped-hoodie-basic-3","zipped-hoodie-basic-4","zipped-hoodie-budget-1","zipped-hoodie-budget-2","zipped-hoodie-budget-3","zipped-hoodie-budget-4","zipped-hoodie-budget-5","zipped-hoodie-premium-1","zipped-hoodie-premium-2","zipped-hoodie-premium-3","zipped-hoodie-premium-4","zipped-sweater-basic-1","zipped-sweater-budget-1","zipper-banners","zipper-barriers","zipper-walls","zipper-walls-led"];
const PRODUCT_SLUGS = new Set(PRODUCTS);

/* ----------------------------------------------------------------------------
 * 5. Chemins SEO statiques, éditoriaux & sitemaps connus
 * ------------------------------------------------------------------------- */
const STATIC_SEO_PATHS = [
  "/",
  "/catalogue",
  "/impression-numerique",
  "/grand-format",
  "/supports-publicitaires",
  "/personnalisation",
];

const EDITORIAL_PATHS = [
  "/blog",
  "/imprimerie",
  "/livraison",
  "/mentions-legales",
  "/cgv",
  "/politique-retours",
  "/politique-confidentialite",
];

const KNOWN_SITEMAPS = [
  "/sitemap.xml",
  "/sitemaps/static.xml",
  "/sitemaps/categories.xml",
  "/sitemaps/subcategories.xml",
  "/sitemaps/products.xml",
  "/sitemaps/cities.xml",
  "/sitemaps/departments.xml",
  "/sitemaps/regions.xml",
];

/* Ensemble de tous les chemins SEO gérés (lookup O(1)). */
const MANAGED_SEO_PATHS = new Set([
  ...STATIC_SEO_PATHS,
  ...EDITORIAL_PATHS,
  "/themes",
  ...THEMES.map((s) => `/themes/${s}`),
  ...CITIES.map((s) => `/ville/${s}`),
  ...CITIES.map((s) => `/imprimerie/${s}`),
  ...DEPARTMENTS.map((s) => `/departement/${s}`),
  ...REGIONS.map((s) => `/region/${s}`),
  ...CATEGORIES.map((s) => `/categorie/${s}`),
  ...Object.entries(SUBCATEGORIES).flatMap(([parent, children]) =>
    children.map((child) => `/categorie/${parent}/${child}`)
  ),
  ...PRODUCTS.map((s) => `/products/${s}`),
]);

/* ----------------------------------------------------------------------------
 * 6. Helpers de classification des chemins
 * ------------------------------------------------------------------------- */

/** Fiche produit valide : /products/:slug connu du catalogue. */
function isProductDetail(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2 && parts[0] === "products" && PRODUCT_SLUGS.has(parts[1]);
}

/** Chemins dynamiques à ne JAMAIS mettre en cache. */
function isNoCachePath(pathname) {
  if (isProductDetail(pathname)) return false;
  return (
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/payment-success" ||
    pathname === "/auth" ||
    pathname === "/unsubscribe" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/rest/") ||
    pathname.startsWith("/functions/")
  );
}

/** Asset statique immuable (hash dans le nom de fichier). */
function isImmutableAsset(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    /\.(?:js|mjs|css|woff2?|ttf|otf|eot|png|jpe?g|webp|avif|gif|svg|ico|map)$/i.test(pathname)
  );
}

/** robots.txt ou un sitemap XML. */
function isXmlOrRobots(pathname) {
  return (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemaps/")
  );
}

/** Catégorie ou sous-catégorie valide : /categorie/:cat[/:sub]. */
function isManagedCategoryPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "categorie") return false;
  if (parts.length === 2) return CATEGORIES.includes(parts[1]);
  if (parts.length === 3) {
    const children = SUBCATEGORIES[parts[1]];
    return Array.isArray(children) && children.includes(parts[2]);
  }
  return false;
}

/** HTML mis en cache (ni dynamique, ni asset, ni sitemap). */
function isCacheableHtml(pathname) {
  if (isNoCachePath(pathname)) return false;
  if (isImmutableAsset(pathname)) return false;
  if (isXmlOrRobots(pathname)) return false;
  return true;
}

/** Page SEO gérée (statique, catégorie ou fiche produit). */
function isManagedSeoPath(pathname) {
  return (
    MANAGED_SEO_PATHS.has(pathname) ||
    isManagedCategoryPath(pathname) ||
    isProductDetail(pathname)
  );
}

/**
 * Mappe une URL SEO propre vers son fichier statique prérendu, pour que
 * lorigine serve le vrai HTML (catégorie / ville / …) au lieu de retomber
 * sur le fallback SPA (page daccueil).
 */
function seoOriginPathname(pathname) {
  if (pathname === "/" || !isManagedSeoPath(pathname)) return null;
  if (/\.[a-z0-9]+$/i.test(pathname)) return null;
  return pathname.endsWith("/")
    ? `${pathname}index.html`
    : `${pathname}/index.html`;
}

/** Réécrit le domaine dorigine vers le domaine canonique dans le HTML. */
function rewriteHtmlDomain(text) {
  return text
    .replaceAll("https://print-pro-link.lovable.app", CANONICAL_ORIGIN)
    .replaceAll("http://print-pro-link.lovable.app", CANONICAL_ORIGIN)
    .replaceAll("print-pro-link.lovable.app", CANONICAL_HOST);
}

/** En-têtes de sécurité appliqués à toutes les réponses. */
function applySecurityHeaders(headers) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Worker", "j2lprint-seo/4.5.0");
}

/** Fetch origine : URL publique conservée, résolution DNS forcée vers lorigine dédiée. */
function fetchOrigin(originRequest) {
  return fetch(originRequest, {
    cf: {
      resolveOverride: ORIGIN_HOST,
    },
  });
}

/**
 * AUCUN repli vers la page d'accueil.
 *
 * Pour une URL SEO propre (catégorie, sous-catégorie, ville, département,
 * région, service, thème, fiche produit), on demande UNIQUEMENT le fichier
 * statique prérendu /…/index.html. Toutes ces pages sont prérendues au build :
 *   - si le fichier existe   -> 200 + vrai HTML (title/canonical/H1 propres) ;
 *   - si le fichier manque   -> 404 réel (jamais le shell SPA / la home).
 * Les chemins NON gérés (catalogue dynamique /products, /cart, /themes hors
 * liste, etc.) passent par leur URL propre et conservent le rendu SPA normal.
 */


/* ----------------------------------------------------------------------------
 * 7. Handler principal
 * ------------------------------------------------------------------------- */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 7.1 — Force HTTPS et redirige www -> apex (301)
    if (url.protocol === "http:" || url.hostname === `www.${CANONICAL_HOST}`) {
      const target = new URL(url.toString());
      target.protocol = "https:";
      target.hostname = CANONICAL_HOST;
      return Response.redirect(target.toString(), 301);
    }

    const { pathname: p } = url;
    const method = request.method.toUpperCase();
    const isRead = method === "GET" || method === "HEAD";

    // 7.1b — Diagnostic public : si cette route affiche l'app ou une 404,
    // le Worker Cloudflare n'est pas déployé/routé sur j2lprint.fr.
    if (p === "/__worker") {
      const h = new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-SEO-Managed": "1",
      });
      applySecurityHeaders(h);
      return new Response(JSON.stringify({
        ok: true,
        worker: "j2lprint-seo/4.5.0",
        host: url.hostname,
        origin: ORIGIN_HOST,
        products: PRODUCTS.length,
        themes: THEMES.length,
        cities: CITIES.length,
        departments: DEPARTMENTS.length,
        regions: REGIONS.length,
        fallbackToHome: false,
      }), { status: 200, headers: h });
    }

    // 7.2 — Construit la requête vers lorigine dédiée Cloudflare.
    //        Pour une URL SEO propre (catégorie, sous-catégorie, ville,
    //        département, région, service, thème, fiche produit), on demande
    //        EXCLUSIVEMENT le fichier statique prérendu /…/index.html. Aucun
    //        repli vers l'URL propre n'est tenté : si le fichier manque, on
    //        renvoie une vraie 404 (jamais la page d'accueil).
    //        LURL publique reste https://j2lprint.fr/…, cf.resolveOverride
    //        force Cloudflare à joindre origin.j2lprint.fr, hors route Worker.
    const seoPathname = seoOriginPathname(p);
    const originUrl = new URL(request.url);
    originUrl.protocol = "https:";
    originUrl.hostname = CANONICAL_HOST;
    originUrl.port = "";
    originUrl.pathname = seoPathname || url.pathname;
    //        Le Host envoyé à l'origine DOIT rester le domaine canonique
    //        (j2lprint.fr). Lhébergement Lovable redirige (302) toute requête
    //        *.lovable.app vers le domaine personnalisé : envoyer un Host
    //        *.lovable.app provoquerait une BOUCLE de redirection. Avec
    //        Host: j2lprint.fr + resolveOverride(origin), lorigine sert
    //        directement le HTML prérendu (/…/index.html) en 200.
    const originRequest = new Request(originUrl.toString(), request);
    originRequest.headers.set("Host", CANONICAL_HOST);
    originRequest.headers.set("X-Forwarded-Host", CANONICAL_HOST);
    originRequest.headers.set("X-Forwarded-Proto", "https");

    // 7.3 — Détecte une session connectée (jamais de cache pour ces requêtes)
    const hasSession =
      request.headers.has("Authorization") ||
      /(?:sb-[^=]+-auth-token|sb-access-token|sb-refresh-token)/.test(
        request.headers.get("Cookie") || ""
      );

    const isHead = method === "HEAD";
    const bypassCache = !isRead || isHead || hasSession || isNoCachePath(p);
    if (bypassCache) {
      const resp = await fetchOrigin(originRequest);
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", "no-store");
      applySecurityHeaders(out.headers);
      return out;
    }

    // 7.4 — Cache edge
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set("X-Cache", "HIT");
      return hit;
    }

    const response = await fetchOrigin(originRequest);
    const ct = response.headers.get("Content-Type") || "";

    // 7.5 — Sitemaps & robots.txt
    if (isXmlOrRobots(p)) {
      const body = await response.text();
      const h = new Headers(response.headers);
      if (p.endsWith(".xml")) h.set("Content-Type", "application/xml; charset=utf-8");
      else h.set("Content-Type", "text/plain; charset=utf-8");
      h.set("Cache-Control", `public, max-age=${XML_TTL}`);
      h.set("X-Cache", "MISS");
      applySecurityHeaders(h);
      const out = new Response(body, { status: response.status, headers: h });
      if (response.status === 200) ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    }

    // 7.6 — Assets immuables
    if (isImmutableAsset(p)) {
      const h = new Headers(response.headers);
      h.set("Cache-Control", `public, max-age=${ASSET_TTL}, immutable`);
      h.set("X-Cache", "MISS");
      const out = new Response(response.body, { status: response.status, headers: h });
      if (response.status === 200) ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    }

    // 7.7 — Pages HTML (réécriture domaine + marquage SEO)
    if (ct.includes("text/html")) {
      let body = await response.text();
      body = rewriteHtmlDomain(body);
      const h = new Headers(response.headers);
      h.delete("Content-Length");
      const cacheable = isCacheableHtml(p) && response.status === 200;
      if (cacheable) h.set("Cache-Control", `public, max-age=${HTML_TTL}`);
      else h.set("Cache-Control", "no-store");
      h.set("X-SEO-Managed", isManagedSeoPath(p) ? "1" : "0");
      h.set("X-Cache", "MISS");
      applySecurityHeaders(h);
      const out = new Response(body, { status: response.status, headers: h });
      if (cacheable) ctx.waitUntil(cache.put(cacheKey, out.clone()));
      return out;
    }

    // 7.8 — Tout le reste : pas de cache
    const h = new Headers(response.headers);
    h.set("Cache-Control", "no-store");
    h.set("X-Cache", "BYPASS");
    return new Response(response.body, { status: response.status, headers: h });
  },
};
