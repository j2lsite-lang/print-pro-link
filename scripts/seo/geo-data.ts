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
  const cities = dedupeCities(raw.cities || []);
  const validSlugs = new Set(cities.map((c) => c.slug));
  cache = {
    cities: cities.map((c) => ({
      ...c,
      nearbyCitySlugs: (c.nearbyCitySlugs || [])
        .map((s) => CITY_SLUG_REDIRECTS[s] || s)
        .filter((s, i, arr) => s !== c.slug && validSlugs.has(s) && arr.indexOf(s) === i),
    })),
    departments: (raw.departments || []).map((d) => ({
      ...d,
      citySlugs: (d.citySlugs || [])
        .map((s) => CITY_SLUG_REDIRECTS[s] || s)
        .filter((s, i, arr) => validSlugs.has(s) && arr.indexOf(s) === i),
    })),
    regions: raw.regions || [],
  };
  return cache;
}

