import nomadJson from "@/data/nepal/nomad-cities.json";

/**
 * Schema for `src/data/nepal/nomad-cities.json`.
 * Add a city, or fill an empty array / null, when a figure has a source and an as-of date.
 * Do not add a number that is missing those two fields.
 */
export type NomadAttribution = {
  source: string;
  sourceUrl: string | null;
  asOf: string;
};

export type NomadStat = NomadAttribution & {
  id: string;
  label: string;
  value: string;
};

export type NomadPlace = NomadAttribution & {
  name: string;
  area: string | null;
  note: string | null;
  url: string | null;
};

export type NomadNote = NomadAttribution & {
  title: string;
  body: string;
};

export type NomadCity = {
  slug: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  stats: NomadStat[];
  internet: NomadStat | null;
  bestSeason: NomadNote | null;
  coworking: NomadPlace[];
  cafes: NomadPlace[];
  neighbourhoods: NomadPlace[];
  visa: NomadNote | null;
  sim: NomadNote | null;
  tips: NomadNote[];
};

export const nomadCities = nomadJson.cities as NomadCity[];

export function getNomadCity(slug: string): NomadCity | null {
  return nomadCities.find((city) => city.slug === slug) ?? null;
}
