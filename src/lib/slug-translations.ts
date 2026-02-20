/**
 * Common slug-to-French translations for Print.com API values
 * that don't come with a localized `name` field.
 */
const SLUG_TRANSLATIONS: Record<string, string> = {
  // Urgency
  moderate: "Modéré",
  standard: "Standard",
  quick: "Rapide",
  urgent: "Urgent",
  express: "Express",

  // Packaging
  packaging_plate: "Emballage avec plaque",
  moderate_packaging: "Emballage modéré",
  no_packaging: "Sans emballage",
  packaging_extras: "Options d'emballage",
  bundle_per_100: "par 100",
  bundle_per_250: "par 250",

  // Print type
  "40": "4/0 quadri recto",
  "44": "4/4 quadri recto/verso",
  "10": "1/0 noir recto",
  "11": "1/1 noir recto/verso",

  // Print method
  lfp_uv: "Grand format UV",
  offset: "Offset",
  digital: "Numérique",
  lfp_latex: "Grand format Latex",
  lfp_solvent: "Grand format Solvant",
  screen: "Sérigraphie",

  // Custom shape / cut
  clean_cut: "Coupe au format",
  custom_cut: "Découpe personnalisée",
  no_cut: "Sans découpe",
  rounded_corners: "Coins arrondis",

  // Score / Rainage
  front: "Recto",
  back: "Verso",
  front_and_back: "Recto et verso",
  no: "Sans",
  yes: "Oui",

  // Drillholes
  no_drillholes: "Sans trous",
  four_drillholes: "4 trous",
  fourteen_drillholes_custom: "14 trous (personnalisé)",
  two_drillholes: "2 trous",

  // Folded
  folded: "Plié",
  not_folded: "Non plié",

  // Lamination
  no_lamination: "Sans pelliculage",
  matt_lamination: "Pelliculage mat",
  gloss_lamination: "Pelliculage brillant",

  // Sealed
  "100": "par 100",
  "250": "par 250",

  // Finishing
  no_finishing: "Sans finition",
  
  // Common boolean-like
  true: "Oui",
  false: "Non",
};

/**
 * Humanize a slug: translate if known, otherwise
 * replace underscores with spaces and capitalize first letter.
 */
export function humanizeSlug(slug: string): string {
  if (SLUG_TRANSLATIONS[slug]) {
    return SLUG_TRANSLATIONS[slug];
  }

  // Fallback: replace underscores, capitalize
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}