export type NomadArea = {
  name: string;
  blurb: string;
  tags: string[];
  lat: number | null;
  lng: number | null;
  sources: string[];
};

export type NomadWorkLink = {
  id: string;
  name: string;
  kind: string;
  km: number | null;
};

export type NomadStay = {
  id: string;
  name: string;
  area: string | null;
  nearestArea: string | null;
  type: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geoPrecision: string | null;
  approximateDistance: boolean;
  website: string | null;
  bookingUrls: string[];
  features: string[];
  price: string | null;
  priceShort: string | null;
  workLine: string | null;
  nearbyWork: NomadWorkLink[];
};

export type NomadWorkPlace = {
  id: string;
  name: string;
  area: string | null;
  url: string | null;
  lat: number | null;
  lng: number | null;
};

export type NomadNote = { title: string; body: string };

export type NomadCity = {
  slug: string;
  name: string;
  shortName: string;
  headline: string;
  referenceLine: string;
  sourceUrl: string | null;
  blurb: string;
  costLabel: string | null;
  asOfLabel: string;
  internetQuality: string | null;
  seasonLabel: string | null;
  reference: { label: string; value: string }[];
  ookla: { label: string; url: string } | null;
  areas: NomadArea[];
  stays: NomadStay[];
  coworking: NomadWorkPlace[];
  cafes: NomadWorkPlace[];
  visa: NomadNote[];
  sim: NomadNote[];
  season: NomadNote[];
  tips: NomadNote[];
  osmCredit: string | null;
};

/** Search index for the composer. Public copy only — no source-reconciliation notes. */
export const NOMAD_INDEX = [
  {
    slug: "kathmandu",
    name: "Kathmandu (incl. Lalitpur/Patan)",
    shortName: "Kathmandu",
    headline:
      "The capital and its sister city Patan: cafés, coworking and mountain views, from about $908 a month.",
  },
  {
    slug: "pokhara",
    name: "Pokhara",
    shortName: "Pokhara",
    headline:
      "Beside Phewa Lake, where most Annapurna treks begin: lakeside cafés and quieter side streets, from about $1,030 a month.",
  },
] as const;

export function mappedWork(places: NomadWorkPlace[]): Array<NomadWorkPlace & { lat: number; lng: number }> {
  return places.filter(
    (place): place is NomadWorkPlace & { lat: number; lng: number } =>
      typeof place.lat === "number" && typeof place.lng === "number",
  );
}

const TYPE_LABELS: Record<string, string> = {
  hotel: "Hotel",
  guesthouse: "Guesthouse",
  hostel: "Hostel",
  serviced_apartment: "Serviced apartment",
  apartment: "Apartment",
  coliving: "Coliving",
};

export function stayTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

/** A stay belongs to a best-area card when its own area is that card, otherwise when the file names that neighbourhood. */
export function stayInArea(stay: NomadStay, areaName: string, listedAreas: string[]): boolean {
  if (stay.area && listedAreas.includes(stay.area)) return stay.area === areaName;
  return stay.nearestArea === areaName || stay.area === areaName;
}

export function workInArea(place: NomadWorkPlace, areaName: string): boolean {
  if (!place.area) return false;
  const head = areaName.split("(")[0] ?? areaName;
  const tokens = head
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 2);
  const hay = place.area.toLowerCase();
  return tokens.some((token) => hay.includes(token.toLowerCase()));
}
