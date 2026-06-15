// French grammar helpers for natural location copy: elision and the
// irregular department/region articles (les Vosges, la Marne, l'Aube…).

const VOWEL = /^[aeiouyhàâäéèêëïîôöùûü]/i;

/** "de" → "de Nancy" / "d'Épinal" */
export function de(name: string): string {
  return (VOWEL.test(name) ? "d'" : "de ") + name;
}

interface Article {
  /** "dans les Vosges", "dans la Marne", "dans l'Aube" */
  dans: string;
  /** "des Vosges", "de la Marne", "de l'Aube" */
  de: string;
}

// Keyed by the exact department/region name stored in the database.
export const DEPT_ARTICLE: Record<string, Article> = {
  Vosges: { dans: "dans les Vosges", de: "des Vosges" },
  "Meurthe-et-Moselle": { dans: "dans la Meurthe-et-Moselle", de: "de la Meurthe-et-Moselle" },
  Moselle: { dans: "dans la Moselle", de: "de la Moselle" },
  "Bas-Rhin": { dans: "dans le Bas-Rhin", de: "du Bas-Rhin" },
  "Haut-Rhin": { dans: "dans le Haut-Rhin", de: "du Haut-Rhin" },
  "Haute-Saône": { dans: "dans la Haute-Saône", de: "de la Haute-Saône" },
  Meuse: { dans: "dans la Meuse", de: "de la Meuse" },
  Marne: { dans: "dans la Marne", de: "de la Marne" },
  Aube: { dans: "dans l'Aube", de: "de l'Aube" },
  "Haute-Marne": { dans: "dans la Haute-Marne", de: "de la Haute-Marne" },
  "Grand Est": { dans: "dans le Grand Est", de: "du Grand Est" },
  "Bourgogne-Franche-Comté": { dans: "dans la Bourgogne-Franche-Comté", de: "de la Bourgogne-Franche-Comté" },
};

/** Fallback that guesses an article when a name is not in the map. */
export function article(name: string): Article {
  if (DEPT_ARTICLE[name]) return DEPT_ARTICLE[name];
  return VOWEL.test(name)
    ? { dans: `dans l'${name}`, de: `de l'${name}` }
    : { dans: `dans le ${name}`, de: `du ${name}` };
}
