import indexJson from "@/data/nepal/province-index.json";
import { evIndex } from "@/lib/nepal/ev";

export type BBox = [number, number, number, number];

export type ProvinceRecord = {
  slug: string;
  name: string;
  iso: string;
  lat: number;
  lng: number;
  bbox: BBox;
  count: number;
};

type IndexFile = {
  source: string;
  sourceUrl: string;
  license: string;
  licenseNote: string;
  nepal: { bbox: BBox };
  provinces: Array<{
    slug: string;
    name: string;
    iso: string;
    lat: number;
    lng: number;
    bbox: BBox;
  }>;
};

const index = indexJson as IndexFile;

export const PROVINCE_BOUNDARY_CREDIT = {
  source: index.source,
  sourceUrl: index.sourceUrl,
  license: index.license,
  licenseNote: index.licenseNote,
};

export const NEPAL_BBOX: BBox = index.nepal.bbox;

/** Cities the charge screen offers as chips. Each one has chargers in the directory. */
export const MAJOR_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Pokhara",
  "Bharatpur",
  "Butwal",
  "Biratnagar",
  "Birgunj",
  "Dhangadhi",
] as const;

/**
 * Counts come from the station index after a point-in-polygon check against
 * geoBoundaries ADM1. The stored province names matched that test for every station.
 */
export const provinceRecords: ProvinceRecord[] = index.provinces.map((province) => ({
  ...province,
  count: evIndex.filter((station) => station.province === province.name).length,
}));

export function provinceBySlug(slug: string | null | undefined): ProvinceRecord | null {
  if (!slug) return null;
  const key = slug.trim().toLowerCase();
  return provinceRecords.find((province) => province.slug === key) ?? null;
}

export function provinceByName(name: string | null | undefined): ProvinceRecord | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return provinceRecords.find((province) => province.name.toLowerCase() === key) ?? null;
}
