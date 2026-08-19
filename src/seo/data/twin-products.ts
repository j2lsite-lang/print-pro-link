/**
 * Twin-product display-name overrides.
 *
 * Some Print.com SKUs share an IDENTICAL `titleSingle`/`name` even though they
 * are distinct products (a flag vs. its pole, a bottle-opener vs. a cap-opener,
 * a brushed Dibond vs. a photo-on-aluminium, …). When two SKUs collide on the
 * same name, every derived field (title, meta description, H1, intro) becomes a
 * duplicate.
 *
 * This map gives each colliding SKU a UNIQUE, FACTUAL display name based on the
 * product's real identity (its SKU semantics, model name, material, fixing type
 * or support type). Nothing is invented: every qualifier reflects what the SKU
 * actually is. SKUs, prices, the configurator, cart and quote flow are NEVER
 * affected — only the editorial SEO copy.
 */
export const TWIN_PRODUCT_NAMES: Record<string, string> = {
  // Beach flag : the structure (pole + base) vs. the printed flag itself.
  "beachflag-poles": "Beach flag — mât et accessoires",
  "beachflags": "Beach flag — drapeau publicitaire imprimé",

  // Insulated stainless-steel bottle : one is the "Belo" model.
  "belo-isolated-bottle": "Gourde isotherme en inox Belo",
  // insulated-stainless-steel-bottle keeps its generic name (now unique).

  // Opener : a bottle-opener vs. a cap-opener (décapsuleur).
  "cap-opener": "Décapsuleur",
  // bottle-opener keeps "Ouvre-bouteille".

  // Key-ring opener : bottle-opener vs. cap-opener variant.
  "key-ring-bottle-opener": "Porte-clé décapsuleur",
  // bottle-opener-key-ring keeps "Porte-clé avec ouvre-bouteille".

  // Aluminium panels : brushed Dibond (butler finish) vs. photo on aluminium.
  "photo-aluminium": "Photo sur aluminium Dibond",
  // dibond-butler-finish keeps "Dibond aluminium brossé".

  // Textile : standard fabric vs. SEG (tensioned silicone-edge fabric).
  "seg-fabrics": "Toile textile SEG (cadre tendu)",
  // fabrics keeps "Toile textile".

  // Plastic drinkware : sport bottle vs. reusable gourd.
  "plastic-drinkingbottle": "Bouteille d'eau en plastique",
  // plastic-bottle keeps "Gourde en plastique".

  // ── Noms techniques fournisseur → noms commerciaux français clairs ──
  // (matériaux/marques Print.com affichés bruts : on donne un libellé vendeur
  //  fidèle à la matière et à la catégorie réelle, sans rien inventer.)
  "airtex": "Bâche microperforée Airtex",
  "backlit": "Bâche backlit pour caisson lumineux",
  "chopsticks": "Baguettes japonaises",
  "dispa": "Panneau carton léger Dispa",
  "frisbee": "Frisbee publicitaire",
  "parasol": "Parasol publicitaire",
  "pes-outdoor": "Bâche textile PES Outdoor (100% recyclable)",
  "re-board": "Panneau carton alvéolaire Re-board",
  "segrollr": "Roll-up textile SegRollR",
  "stormfix": "Banderole Stormfix résistante au vent",
  // ── Libellés fournisseur en anglais → noms produits français ──
  "aluminium-floating-frames": "Cadre flottant en aluminium pour panneau",
  "banner-pole-brackets": "Supports de mât pour banderole",
  "baseplate-side-textile-frame": "Plaque de base latérale pour cadre textile",
  "baseplate-textile-frame": "Plaque de base pour cadre textile",
  "chocolate-letter-sleeve": "Lettre en chocolat avec étui personnalisé",
  "custom-banner": "Bâche publicitaire forme sur mesure",
  "display-cards": "Carte présentoir personnalisée",
  "double-sided-window-stickers": "Autocollant vitrine double face",
  "easter-eggs": "Œufs de Pâques en chocolat personnalisés",
  "envelopes-with-side-fold": "Enveloppe avec soufflet latéral",
  "flag-fixers": "Fixations pour drapeau Flag fixers®",
  "foldable-banners": "Bâche pliable",
  "framed-posters": "Affiche encadrée",
  "holographic-stickers": "Autocollant holographique",
  "hoodie-premium-3": "Sweat à capuche B&C King",
  "info-stands": "Présentoir d'information",
  "info-stands-deluxe": "Présentoir d'information deluxe",
  "interchangable-sling-deckchair": "Transat avec toile interchangeable",
  "led-frame-counters": "Comptoir cadre LED",
  "lunch-boxes": "Lunch box personnalisée",
  "nylon-spacers-glue": "Colle pour entretoises nylon",
  "olive-oil": "Bouteille d'huile d'olive personnalisée",
  "pet-felt-sample-chain": "Nuancier de matières PET-felt",
  "pet-felt-suspension-kits": "Kit de suspension PET-felt",
  "pet-felt-wall-panels": "Panneau mural acoustique PET-felt",
  "powerbank-wireless-magnetic": "Batterie externe magnétique sans fil",
  "recycled-gymsac": "Sac de sport recyclé",
  "shot-glasses-set": "Set de verres à shot personnalisés",
  "snap-frames-waterproof": "Cadre clic-clac étanche",
  "softshell-jacket-with-hood": "Veste softshell à capuche",
  "suction-cup-windowflag-stick": "Ventouse avec mât pour drapeau de vitrine",
  "suspension-set-canvas": "Kit de suspension pour toile",
  "sweater-basic-2": "Sweat Fruit of the Loom Premium",
  "sweater-budget-2": "Sweat Fruit of the Loom Classic",
  "sweater-budget-3": "Sweat B&C Set In",
  "sweater-budget-8": "Sweat Fruit of the Loom Lightweight Raglan",
  "table-stands": "Présentoir de comptoir sur pied",
  "textile-stickers": "Autocollant textile",
  "textile-stretcher-a-boards": "Chevalet A avec cadre textile",
  "wall-mount-textile-frame": "Fixation murale pour cadre textile",
  "window-flag": "Drapeau de vitrine",
  "wine-set": "Coffret à vin personnalisé",
  "wineboxes-pet-felt": "Coffret à vin en PET-felt",
  "x-banners": "X-banner publicitaire",
  "zipped-sweater-budget-1": "Sweat zippé Fruit of the Loom Premium",
};

/** Return the SEO display name for a SKU (override when twin, else original). */
export function twinDisplayName(sku: string, fallback: string): string {
  return TWIN_PRODUCT_NAMES[sku] || fallback;
}
