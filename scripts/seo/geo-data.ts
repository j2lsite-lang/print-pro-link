// Loads the merged national geographic reference (599 cities, 101 departments,
// 18 regions) produced from the 4 sites + geo.api.gouv.fr. Single source of
// truth for the city / department / region SEO pages and the sitemaps.
import { readFileSync } from "fs";
import { resolve } from "path";

export interface GeoCity {
  name: string;
  slug: string;
  postalCodes: string[];
  departmentCode: string;
  departmentName: string;
  departmentSlug: string;
  regionName: string;
  regionSlug: string;
  sourceSites: string[];
  nearbyCitySlugs: string[];
}
export interface GeoDepartment {
  code: string;
  name: string;
  slug: string;
  regionName: string;
  regionSlug: string;
  citySlugs: string[];
  neighborDepartmentSlugs: string[];
  sourceSites: string[];
}
export interface GeoRegion {
  name: string;
  slug: string;
  departmentSlugs: string[];
  sourceSites: string[];
}
export interface GeoData {
  cities: GeoCity[];
  departments: GeoDepartment[];
  regions: GeoRegion[];
}

let cache: GeoData | null = null;

/**
 * Régions/départements exclus du périmètre commercial J2L Print (DOM-TOM).
 * Leurs pages villes / départements / régions ne sont plus générées ni
 * référencées ; les anciennes URL sont redirigées en 301 vers /catalogue
 * par le Worker (REMOVED_GEO_PATHS). La Guadeloupe est conservée.
 */
export const EXCLUDED_REGION_SLUGS = new Set([
  "guyane",
  "martinique",
  "mayotte",
  "la-reunion",
]);

/** Chemins des pages géographiques supprimées -> 301 /catalogue. */
export const REMOVED_GEO_PATHS: string[] = [];

/**
 * Communes présentes deux fois dans la base (même nom + même département,
 * deux slugs). On ne garde qu'une URL indexable ; l'ancien slug est
 * redirigé en 301 par le Worker (voir CITY_SLUG_REDIRECTS).
 */
export const CITY_SLUG_REDIRECTS: Record<string, string> = {};


function dedupeCities(cities: GeoCity[]): GeoCity[] {
  const byKey = new Map<string, GeoCity>();
  const kept: GeoCity[] = [];
  for (const city of cities) {
    const key = `${city.name}|${city.departmentSlug}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, city);
      kept.push(city);
      continue;
    }
    // Keep the shortest (cleanest) slug, redirect the other one.
    const [keep, drop] =
      city.slug.length < existing.slug.length ? [city, existing] : [existing, city];
    byKey.set(key, keep);
    const idx = kept.indexOf(existing);
    if (idx >= 0) kept[idx] = keep;
    CITY_SLUG_REDIRECTS[drop.slug] = keep.slug;
  }
  return kept;
}

export function loadGeo(): GeoData {
  if (cache) return cache;
  const p = resolve("src/seo/data/geography-national.json");
  const raw = JSON.parse(readFileSync(p, "utf8")) as GeoData;
  const allCities = dedupeCities(raw.cities || []);

  // --- Exclusion DOM-TOM (Guyane, Martinique, Mayotte, La Réunion) ---------
  const excluded = (regionSlug: string) => EXCLUDED_REGION_SLUGS.has(regionSlug);
  const removedCities = allCities.filter((c) => excluded(c.regionSlug));
  const cities = allCities.filter((c) => !excluded(c.regionSlug));
  const removedDepartments = (raw.departments || []).filter((d) => excluded(d.regionSlug));
  const departmentsKept = (raw.departments || []).filter((d) => !excluded(d.regionSlug));
  const removedRegions = (raw.regions || []).filter((r) => excluded(r.slug));
  const regions = (raw.regions || []).filter((r) => !excluded(r.slug));

  const removedCitySlugs = new Set(removedCities.map((c) => c.slug));
  // Un ancien slug redirigé vers une ville supprimée devient lui aussi une
  // URL supprimée (301 /catalogue), jamais une 301 vers une page inexistante.
  for (const [from, to] of Object.entries(CITY_SLUG_REDIRECTS)) {
    if (removedCitySlugs.has(to)) {
      delete CITY_SLUG_REDIRECTS[from];
      removedCitySlugs.add(from);
    }
  }
  REMOVED_GEO_PATHS.length = 0;
  REMOVED_GEO_PATHS.push(
    ...[...removedCitySlugs].flatMap((s) => [`/ville/${s}`, `/imprimerie/${s}`]),
    ...removedDepartments.map((d) => `/departement/${d.slug}`),
    ...removedRegions.map((r) => `/region/${r.slug}`),
  );
  REMOVED_GEO_PATHS.sort();

  const validSlugs = new Set(cities.map((c) => c.slug));
  const validDeptSlugs = new Set(departmentsKept.map((d) => d.slug));
  cache = {
    cities: cities.map((c) => ({
      ...c,
      nearbyCitySlugs: (c.nearbyCitySlugs || [])
        .map((s) => CITY_SLUG_REDIRECTS[s] || s)
        .filter((s, i, arr) => s !== c.slug && validSlugs.has(s) && arr.indexOf(s) === i),
    })),
    departments: departmentsKept.map((d) => ({
      ...d,
      citySlugs: (d.citySlugs || [])
        .map((s) => CITY_SLUG_REDIRECTS[s] || s)
        .filter((s, i, arr) => validSlugs.has(s) && arr.indexOf(s) === i),
      neighborDepartmentSlugs: (d.neighborDepartmentSlugs || []).filter((s) =>
        validDeptSlugs.has(s),
      ),
    })),
    regions: regions.map((r) => ({
      ...r,
      departmentSlugs: (r.departmentSlugs || []).filter((s) => validDeptSlugs.has(s)),
    })),
  };
  return cache;

}

