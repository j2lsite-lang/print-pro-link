// Curated catalogue sections shown on the Catalogue page, mirroring the
// "Nouveautés" and "Nos best-sellers" rows on Print.com.
//
// SKUs are matched against the live Print.com catalogue (getCatalogProducts +
// public SKU set) at render time, so any SKU absent from the public catalogue
// is silently dropped — every displayed product is from the Print.com API and
// has a working fiche/configurateur at /products/{sku}. No duplicates: each
// section dedupes by SKU and the UI keeps source order.

// Print.com CMS group "new-and-updated" (Nouveautés).
export const NOUVEAUTES_SKUS: string[] = [
  "aluminium-floating-frames",
  "avery-rpet-drinking-bottle",
  "beanbags",
  "bookmarks",
  "boxes_with_two_lids",
  "card-sets",
  "choco-truffle-easter",
  "chocolates",
  "counters",
  "easter-eggs",
  "envelopes-with-side-fold",
  "grass-paper-notebook",
  "info-stands",
  "jude-rpet-drinkingbottle",
  "loop-rpet-drinking-bottle",
  "maps",
  "mini-magazines",
  "notebook-felt",
  "notebook-rpet-cover",
  "pet-felt-wall-panels",
  "premium-socks",
  "re-board-seasonal",
  "recycled-cardboard-notebook",
  "recycled-leather-notebook",
  "recycled-pu-notebook",
  "shaker-drinking-bottle",
  "textile-stretcher-a-boards",
];

// Print.com "popular products" menus (best-sellers), excluding non-customer
// SKUs (signing, samplebox).
export const BESTSELLER_SKUS: string[] = [
  "flyers",
  "businesscards",
  "folders",
  "posters",
  "banners",
  "postcards",
  "printed-letterheads",
];
