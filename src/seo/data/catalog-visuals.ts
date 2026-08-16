/**
 * Visuels produits réels issus du catalogue J2L Print (images fournisseur Print.com / CDN Contentful).
 * Aucune image générée : chaque URL correspond à la photo officielle d'un produit du catalogue.
 * Les images sont servies via l'API d'images du CDN (redimensionnement + WebP) pour rester légères sur mobile.
 */

export interface CatalogVisual {
  /** SKU catalogue dont provient la photo */
  sku: string;
  /** URL d'origine (CDN) */
  url: string;
  /** Texte alternatif */
  alt: string;
}

/** Ajoute les paramètres de redimensionnement/compression du CDN Contentful. */
export function cdnImage(url: string, width: number, height?: number, quality = 68): string {
  if (!url) return url;
  if (!url.includes("images.ctfassets.net")) return url;
  const params = new URLSearchParams({ w: String(width), fm: "webp", q: String(quality) });
  if (height) {
    params.set("h", String(height));
    params.set("fit", "fill");
    params.set("f", "center");
  }
  return `${url}?${params.toString()}`;
}

const V = (sku: string, url: string, alt: string): CatalogVisual => ({ sku, url, alt });

/** Visuels produits réels, indexés par clé de rubrique/carte. */
export const catalogVisuals: Record<string, CatalogVisual> = {
  // ── Grand format ──
  "baches-publicitaires": V(
    "banners",
    "https://images.ctfassets.net/ez9mp376cw6o/4AXS3ZuRzSi8R2ySQAAhj3/c1139468d24a5cc64b66524d04e4f26d/Hanging_banner_A_detail_2.jpg",
    "Bâche publicitaire PVC imprimée avec œillets",
  ),
  "banderoles-calicots": V(
    "banners",
    "https://images.ctfassets.net/ez9mp376cw6o/4F06Y7HfKeCfQZ08XhdCxB/4aefea0f09486af14feceaaf07f631fe/Hanging_banner_A_hk.jpg",
    "Banderole publicitaire imprimée tendue en façade",
  ),
  "adhesifs-vinyles": V(
    "car-stickers",
    "https://images.ctfassets.net/ez9mp376cw6o/5vdDtIWLoSGZCH6gWPVkCr/0dbe265d39a005f7f5e21d6e75d62928/sample-autosticker-wit-zij_catalog_720.jpg",
    "Adhésif vinyle personnalisé pour véhicule et vitrine",
  ),
  "vitrophanie": V(
    "clearview-vinyl",
    "https://images.ctfassets.net/ez9mp376cw6o/6nuiDjkyfUWYOYftK75Feq/c4ccf7d7d236633b170486860a995105/window-sticker-5.jpg",
    "Vitrophanie adhésive transparente collée sur vitrine",
  ),
  "kakemonos-rollups": V(
    "roller-banners",
    "https://images.ctfassets.net/ez9mp376cw6o/2me0fBtM2XGe0md81qhS21/67f99e3dc164331c85dd8f2b244bf774/Budget-Frontal.jpg",
    "Roll-up publicitaire enrouleur avec visuel imprimé",
  ),
  "enseignes-panneaux": V(
    "dibond",
    "https://images.ctfassets.net/ez9mp376cw6o/6ZBlvZpvL5g9xS33BLiFfv/a8222df97a667e868531ff9205872219/Rigids-Dibond-budget-4mm.jpg",
    "Panneau rigide Dibond aluminium imprimé",
  ),
  "panneaux-pvc": V(
    "forex",
    "https://images.ctfassets.net/ez9mp376cw6o/2Rfd2vXqQxa5bLhriFuSPJ/c928f8147a4ac230c78339c97c645ca7/Rigids-Forex-White-3-mm.jpg",
    "Panneau PVC expansé Forex imprimé",
  ),
  "decoration-murale": V(
    "acoustic-wall-frames",
    "https://images.ctfassets.net/ez9mp376cw6o/1HtGfScDuY17T22lWTL6nz/a55e943b6dd331a8d76c34951b48b1af/AcousticWallFrame_Total_2.jpg",
    "Panneau mural textile imprimé pour décoration intérieure",
  ),
  "sol-vinyle": V(
    "floor-vinyl",
    "https://images.ctfassets.net/ez9mp376cw6o/1iaGmtwHufMSbSuvxOXz8v/9238792e0986ef408b17381010bc28f6/Home-Total.jpg",
    "Vinyle adhésif de sol imprimé",
  ),

  // ── Supports publicitaires / PLV ──
  "drapeaux-oriflammes": V(
    "beachflags",
    "https://images.ctfassets.net/ez9mp376cw6o/1I7Hnx5oMlHWlXyIjaufeC/d3d61c0c55c3ce5acf0895186004bfc7/Beachflag_recht_2.jpg",
    "Beach flag publicitaire imprimé sur mât",
  ),
  "tentes-barnums": V(
    "foldable-tent",
    "https://images.ctfassets.net/ez9mp376cw6o/3wdrcgXHUwotr59oWVlBet/99eadf625fb41a213eac8da7dd5e8894/Foldable-Tent-Total-Front.jpg",
    "Tente pliante publicitaire personnalisée",
  ),
  "totems-colonnes": V(
    "totem-displays",
    "https://images.ctfassets.net/ez9mp376cw6o/1bDor8U79He6sgjT2Nt77M/e67abecd1ce65691d6837821265cdb9b/totem-03.jpg",
    "Totem publicitaire textile imprimé",
  ),
  "comptoirs-accueil": V(
    "counters",
    "https://images.ctfassets.net/ez9mp376cw6o/1XlUghGNGnwvjwnmK6AMUH/d20270f22f1b5c3df227f0ca9a1fc358/Counter-square-Total.jpg",
    "Comptoir d'accueil textile personnalisé pour salon",
  ),
  "plv-presentoirs": V(
    "folder-display",
    "https://images.ctfassets.net/ez9mp376cw6o/1CNpZWqfnI4xU8XBenNQNw/e11ae40581c52fdf92a4c33bbc51dc3d/folder_display.jpg",
    "Présentoir PLV porte-brochures personnalisé",
  ),
  "chevalets-stop-trottoirs": V(
    "pavement-signs-a-board",
    "https://images.ctfassets.net/ez9mp376cw6o/4q7lFmmgHrWCvZKxrvl8TF/d76be8474992d72ba29d01a658f5deb6/A-Bord-Black-Corner.jpg",
    "Stop-trottoir chevalet publicitaire",
  ),
  "chevalets-comptoir": V(
    "display-standing",
    "https://images.ctfassets.net/ez9mp376cw6o/13iFyVfUY8B7zSGFGbBO7V/dc206a2e0ed179e8293a25aec4ca5072/Display_Carre_M.jpg",
    "Chevalet de comptoir imprimé",
  ),
  "panneaux-exterieurs": V(
    "lamppost-signs",
    "https://images.ctfassets.net/ez9mp376cw6o/3a26b0AABIKHK7ZBKaZVmI/4b24ef97e817dde4a753e0a166061de2/Lamppost_Signs_logo_name_hk_grijs-bewerkt.jpg",
    "Panneau extérieur imprimé pour poteau d'éclairage",
  ),

  // ── Impression numérique / papier ──
  "cartes-de-visite": V(
    "businesscards",
    "https://images.ctfassets.net/ez9mp376cw6o/jBnx39Z1Ic0bj4bhoPOUf/be92363093ef0414c61ea9a5a2a9a9ba/Business_Cards__1_.jpg",
    "Cartes de visite imprimées personnalisées",
  ),
  "cartes-de-visite-luxe": V(
    "luxurious-businesscards",
    "https://images.ctfassets.net/ez9mp376cw6o/5hMBRBJaFjXtplYPBi5Q3w/d4964a06f0de91240ebc096e321d40e2/luxe-business-cards_catalog_720.jpg",
    "Cartes de visite luxe et letterpress",
  ),
  "flyers-depliants": V(
    "election-flyers",
    "https://images.ctfassets.net/ez9mp376cw6o/27Tx0BQ76RdegkACwfsC0V/fb45b1d11b0e56c2cce9b9b6543bfe63/Flyers.jpg",
    "Flyers et dépliants imprimés en couleur",
  ),
  "affiches-posters": V(
    "posters",
    "https://images.ctfassets.net/ez9mp376cw6o/44XQ3A84GYKP8ke0BVXolR/93f3cfc61f5f01127f6abacd1c92ff7e/Lightbox_poster_citylight.jpg",
    "Affiche grand format imprimée",
  ),
  "brochures-catalogues": V(
    "stapled-magazines",
    "https://images.ctfassets.net/ez9mp376cw6o/1TTZ8qiEOWJaqjbTrHrH6W/6dab53cc0b04b6e04795b6b52f29d54f/Brochures-tear-resistant-pile-turned.jpg",
    "Brochures et catalogues agrafés imprimés",
  ),
  "papeterie-entreprise": V(
    "business-stationery",
    "https://images.ctfassets.net/ez9mp376cw6o/eWfVPTtLh6GBH3wMygjvH/002c32130b15e667e3769192c5407624/Stationary-writing-paper.jpg",
    "Papeterie d'entreprise : têtes de lettre personnalisées",
  ),
  "enveloppes": V(
    "printed-envelopes",
    "https://images.ctfassets.net/ez9mp376cw6o/4A8eTXtcgSJZTzelH1363r/9ebeae68dc7e2de2d1333ec12d85c13d/envelopes-catalog_720.jpg",
    "Enveloppes imprimées personnalisées",
  ),
  "faire-part-invitations": V(
    "postcards-with-envelopes",
    "https://images.ctfassets.net/ez9mp376cw6o/3Dj9qXtlhRDHa526B795te/27d32c0f29ddf672c0aac732ab455714/postcards-catalog_720.jpg",
    "Cartes et faire-part imprimés avec enveloppes",
  ),
  "chemises-presentation": V(
    "presentation-folders",
    "https://images.ctfassets.net/ez9mp376cw6o/2eV0OWcLknCbX6FxRQD6zy/8fc12f734da4c37dbfd765db52287785/presentation-folder-big-open.jpg",
    "Chemise à rabats de présentation imprimée",
  ),

  // ── Personnalisation / textiles / objets ──
  "tshirts-polos": V(
    "t-shirt-basic-1",
    "https://images.ctfassets.net/ez9mp376cw6o/3lJkNIGc9tPAVzTVnrKQ4w/6792865cbe8baf09b9746c64653dd927/B_C-E1905TW04TWomenorchidpink10157.jpg",
    "T-shirt personnalisable pour marquage textile",
  ),
  "polos": V(
    "polo-basic-4",
    "https://images.ctfassets.net/ez9mp376cw6o/2At6M9z8q68Z6vGwFtGndd/4ea31e6d1f77a235687508b2e96e1c07/Cli-Basicpolo28230MetalGrey_956_17961.jpg",
    "Polo personnalisable brodé ou imprimé",
  ),
  "sweats-vestes": V(
    "hoodie-basic-1",
    "https://images.ctfassets.net/ez9mp376cw6o/2eaFio3GQsTXjjqoYmDVpQ/724a4919f612f3dc1cc564350ef68c55/Rus-Men-sAuthenticHoodedSweat26500urbangrey4600.jpg",
    "Sweat à capuche personnalisable",
  ),
  "sweaters": V(
    "sweater-basic-1",
    "https://images.ctfassets.net/ez9mp376cw6o/3ki5bFkX5f4KSelVhqmdZb/0419db2140f6464ad685b5c86e9a8441/Rus-TheAuthenticSweat21600262urbangrey10966__1_.jpg",
    "Sweat-shirt personnalisable pour équipes",
  ),
  "mugs-thermos": V(
    "custom-mugs",
    "https://images.ctfassets.net/ez9mp376cw6o/6e0jlsYunqpAJKYFIF7Br9/38068fe10e23798e1b171827d3a410c3/Kitty_mok_30cl__1_.jpg",
    "Mug personnalisé avec logo",
  ),
  "stylos-papeterie": V(
    "budget-pen-contour",
    "https://images.ctfassets.net/ez9mp376cw6o/46rDa5Rqhleu557n4dS74a/6a728b8afebba78ea893f08aadc66c89/Budget_pennen_01.jpg",
    "Stylos publicitaires personnalisés",
  ),
  "sacs-bagagerie": V(
    "canvas-tote-bags",
    "https://images.ctfassets.net/ez9mp376cw6o/6slpbl8eOgpiKcjfdvhrzf/71a5a3f84c7da38255e59d693d73177d/canvas-tote-bags-black-inside.jpg",
    "Tote bag en coton personnalisé",
  ),
  "hightech-usb": V(
    "usb-sticks-twister",
    "https://images.ctfassets.net/ez9mp376cw6o/1LSvDML94c8F8GCkWEa605/141f221357cc43e278756eb50a9408fe/usb_sticks_1001-05_open_1_720.jpg",
    "Clés USB personnalisées avec logo",
  ),

  // ── Étiquettes, emballages ──
  "etiquettes-stickers": V(
    "labels-on-roll",
    "https://images.ctfassets.net/ez9mp376cw6o/4tyFlKO7B5OhlGCIZwxKcm/66396b021793c4182f63ed430dc04693/Stickers_rol.jpg",
    "Étiquettes adhésives en rouleau personnalisées",
  ),
  "emballages-sacs": V(
    "boxes-fefco-0201-digital",
    "https://images.ctfassets.net/ez9mp376cw6o/17Qjq7aL54BbOTHiilyLC9/cc5fde267a604a4a34bb83d071f6f73a/Boxes_fefco_red_A.jpg",
    "Boîte carton personnalisée imprimée",
  ),
  "toiles-canvas": V(
    "canvas",
    "https://images.ctfassets.net/ez9mp376cw6o/6GFt6gVwEhBqYbPmZRnYXR/016019f2d1629664031228797b5383c5/Textilefabrics-Canvas.jpg",
    "Toile canvas imprimée",
  ),
  "sets-de-table": V(
    "placemats",
    "https://images.ctfassets.net/ez9mp376cw6o/42xb52PzHD8UDh1V3gue1p/7a2aeed96a5bcf492efdd0d498672f55/hospitality_placemats_2_720.jpg",
    "Sets de table imprimés personnalisés",
  ),
};

/** Visuels des 8 univers du catalogue (pages /categorie/...). */
export const categoryVisuals: Record<string, CatalogVisual> = {
  "impression-papier": catalogVisuals["cartes-de-visite"],
  "publicite-exterieure": catalogVisuals["baches-publicitaires"],
  "publicite-interieure": catalogVisuals["kakemonos-rollups"],
  "etiquettes-stickers": catalogVisuals["etiquettes-stickers"],
  "emballages-sacs": catalogVisuals["emballages-sacs"],
  "objets-publicitaires-cadeaux": catalogVisuals["mugs-thermos"],
  "textiles-accessoires": catalogVisuals["tshirts-polos"],
  "panneaux-baches-vinyles-toiles": catalogVisuals["enseignes-panneaux"],
};

/** Résout un visuel à partir d'un chemin interne (/categorie/xxx ou /products/category/xxx). */
export function visualForPath(path: string): CatalogVisual | undefined {
  const slug = path.split("?")[0].replace(/\/$/, "").split("/").pop() || "";
  if (categoryVisuals[slug]) return categoryVisuals[slug];
  const fallbackBySlug: Record<string, string> = {
    "roll-ups": "kakemonos-rollups",
    "baches-banderoles": "baches-publicitaires",
    "films-adhesifs-type": "adhesifs-vinyles",
    "films-adhesifs": "adhesifs-vinyles",
    "toiles-textiles-deco-interieure": "decoration-murale",
    "toiles-textiles": "toiles-canvas",
    "drapeaux-beachflags-accessoires": "drapeaux-oriflammes",
    "tonnelles-mobilier-exterieur": "tentes-barnums",
    "bannieres-structures-fixation": "totems-colonnes",
    "stands-materiel-expo": "comptoirs-accueil",
    "presentoirs-materiel-plv": "plv-presentoirs",
    "stop-trottoirs-panneaux": "chevalets-stop-trottoirs",
    "panneaux-accessoires": "enseignes-panneaux",
    "panneaux-accessoires-ext": "panneaux-exterieurs",
    "panneaux-accessoires-int": "chevalets-comptoir",
    "cartes-visite-enveloppes": "cartes-de-visite",
    "flyers-depliants-affiches": "flyers-depliants",
    "brochures-magazines": "brochures-catalogues",
    papeterie: "papeterie-entreprise",
    "articles-papeterie": "stylos-papeterie",
    "courriers-creatifs": "faire-part-invitations",
    vetements: "tshirts-polos",
    "textiles-sport": "tshirts-polos",
    "verrerie-vaisselle-gourdes": "mugs-thermos",
    "sacs-tote-bags": "sacs-bagagerie",
    gadgets: "hightech-usb",
    "petits-autocollants": "etiquettes-stickers",
    "autocollants-grand-format": "adhesifs-vinyles",
    "emballages-cadeaux": "emballages-sacs",
    "emballages-expedition": "emballages-sacs",
    "emballages-alimentaires": "sets-de-table",
    "catering-restaurants": "sets-de-table",
    "mobilier-interieur": "decoration-murale",
    calendriers: "papeterie-entreprise",
  };
  const key = fallbackBySlug[slug];
  return key ? catalogVisuals[key] : undefined;
}
