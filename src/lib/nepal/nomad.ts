import nomadJson from "@/data/nepal/nomad-cities.json";

/**
 * Schema for `src/data/nepal/nomad-cities.json`.
 * Add a city, or fill an empty array, when a figure has a source and an as-of date.
 * Do not add a number that is missing those two fields.
 */
export type NomadAttribution = {
  source: string;
  sourceUrl: string | null;
  asOf: string;
};

export type NomadSourced = NomadAttribution & {
  also: NomadAttribution[];
};

export type NomadStat = NomadSourced & {
  id: string;
  label: string;
  value: string;
  note: string | null;
};

export type NomadBadge = "listed" | "stale";

export type NomadPlace = NomadSourced & {
  name: string;
  area: string | null;
  note: string | null;
  url: string | null;
  lat: number | null;
  lng: number | null;
  badges: NomadBadge[];
};

export type NomadNote = NomadSourced & {
  title: string;
  body: string;
};

export type NomadCity = {
  slug: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  blurb: string;
  blurbSource: NomadAttribution;
  stats: NomadStat[];
  season: NomadNote;
  ookla: { label: string; url: string };
  coworking: NomadPlace[];
  cafes: NomadPlace[];
  neighbourhoods: NomadPlace[];
  visa: NomadNote[];
  sim: NomadNote[];
  tips: NomadNote[];
  /** Verified stays. Empty until `nomad-stays` data is added. */
  stays?: NomadStay[];
};

export type NomadStay = NomadPlace & {
  type: string;
  features: string[];
};

export const nomadCities = nomadJson.cities as NomadCity[];

export function getNomadCity(slug: string): NomadCity | null {
  return nomadCities.find((city) => city.slug === slug) ?? null;
}

export function mappedPlaces(
  places: NomadPlace[],
): Array<NomadPlace & { lat: number; lng: number }> {
  return places.filter(
    (place): place is NomadPlace & { lat: number; lng: number } =>
      typeof place.lat === "number" &&
      typeof place.lng === "number" &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng),
  );
}
