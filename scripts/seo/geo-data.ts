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

export function loadGeo(): GeoData {
  if (cache) return cache;
  const p = resolve("src/seo/data/geography-national.json");
  const raw = JSON.parse(readFileSync(p, "utf8")) as GeoData;
  cache = {
    cities: raw.cities || [],
    departments: raw.departments || [],
    regions: raw.regions || [],
  };
  return cache;
}
