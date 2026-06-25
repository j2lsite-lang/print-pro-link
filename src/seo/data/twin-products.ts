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
  "chopsticks": "Baguettes japonaises personnalisées",
  "dispa": "Panneau carton léger Dispa",
  "frisbee": "Frisbee publicitaire personnalisé",
  "parasol": "Parasol publicitaire personnalisé",
  "pes-outdoor": "Bâche textile PES Outdoor (100% recyclable)",
  "re-board": "Panneau carton alvéolaire Re-board",
  "segrollr": "Roll-up textile SegRollR",
  "stormfix": "Banderole Stormfix résistante au vent",
};


/** Return the SEO display name for a SKU (override when twin, else original). */
export function twinDisplayName(sku: string, fallback: string): string {
  return TWIN_PRODUCT_NAMES[sku] || fallback;
}
