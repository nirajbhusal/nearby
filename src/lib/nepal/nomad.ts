import { formatUpdated } from "@/lib/nepal/format";
import citiesJson from "@/data/nepal/nomad-cities.json";
import staysJson from "@/data/nepal/nomad-stays.json";

type SourceRef = { name?: string; url?: string; label?: string };

type CityStat = {
  label: string;
  value: string | number;
  unit: string | null;
  source_name?: string;
  source_url?: string;
  as_of?: string;
  note?: string;
};

type WorkJson = {
  id: string;
  name: string;
  neighborhood?: string | null;
  area?: string | null;
  lat?: number | null;
  lng?: number | null;
  website?: string | null;
  notes?: string | null;
  sources?: SourceRef[];
};

type CityJson = {
  slug: string;
  name: string;
  hero_blurb?: string;
  stats?: CityStat[];
  coworking?: WorkJson[];
  cafes?: WorkJson[];
  internet?: { sources?: SourceRef[] };
  season?: { best_months?: string; summary?: string; caveat?: string };
  visa?: { see?: string };
  sim?: { see?: string }[];
};

type NearbyWork = {
  id: string;
  name: string;
  kind: string;
  km: number | null;
};

type StayJson = {
  id: string;
  name: string;
  area: string | null;
  nearest_listed_neighborhood?: string | null;
  type: string;
  address?: string | null;
  lat: number | null;
  lng: number | null;
  geo_precision: string | null;
  website?: string | null;
  booking_urls?: string[];
  nomad_features?: string[];
  price_note?: { text?: string; as_of?: string; source?: string } | null;
  nearby_work?: NearbyWork[];
  nearby_work_basis?: string | null;
};

type AreaJson = {
  name: string;
  description?: string;
  suits?: string[];
  center?: { lat?: number; lng?: number };
  sources?: string[];
};

type StaysFile = {
  method?: { osm_attribution?: string };
  cities: Record<string, { best_areas_to_live?: AreaJson[]; stays?: StayJson[] }>;
};

type CitiesFile = {
  cities: CityJson[];
  nepal?: {
    visa?: {
      tourist_visa?: {
        fees_usd?: { days: number; fee: number }[];
        extension?: string;
        late_fine?: string;
        annual_maximum?: string;
        process?: string;
        sources?: SourceRef[];
      };
      work_rules_note?: string;
      residential_visa_note?: string;
      digital_nomad_visa?: { summary?: string; sources?: SourceRef[] };
    };
    sim?: {
      operator: string;
      plan: string;
      price_npr: number;
      validity_days: number;
      data: string;
      as_of: string;
    }[];
    tips?: { topic: string; tip: string; cities?: string[] }[];
    season?: { summary?: string };
  };
};

const citiesFile = citiesJson as CitiesFile;
const staysFile = staysJson as StaysFile;

export type NomadArea = {
  name: string;
  description: string;
  suits: string[];
  lat: number | null;
  lng: number | null;
  sources: string[];
};

export type NomadWorkLink = {
  id: string;
  name: string;
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
  nearbyWork: NomadWorkLink[];
};

export type NomadWorkPlace = {
  id: string;
  name: string;
  area: string | null;
  url: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
};

export type NomadNote = { title: string; body: string };

export type NomadCity = {
  slug: string;
  name: string;
  blurb: string;
  reference: { label: string; value: string; note: string | null }[];
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

const REFERENCE_LABELS = [
  "Nomads.com rank",
  "Cost of living for nomad",
  "Internet speed (avg)",
  "Safety",
];

function hostOf(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function priceLine(note: StayJson["price_note"]): string | null {
  const text = note?.text?.trim();
  if (!text) return null;
  const host = hostOf(note?.source);
  const when = note?.as_of ? formatUpdated(note.as_of) : "";
  if (!host || !when) return text;
  const body = text.endsWith(".") ? text.slice(0, -1) : text;
  return `${body}, per ${host}, ${when}.`;
}

function statValue(stat: CityStat): string {
  const value = String(stat.value);
  if (stat.unit === "rank") return `#${value}`;
  if (stat.unit === "USD/month") return `USD ${value}/month`;
  if (stat.unit === "Mbps") return `${value} Mbps`;
  if (stat.unit === "/5") return `${value}/5`;
  return value;
}

function workPlace(place: WorkJson): NomadWorkPlace {
  const source = place.sources?.find((item) => item.url);
  return {
    id: place.id,
    name: place.name,
    area: place.area || place.neighborhood || null,
    url: place.website || source?.url || null,
    lat: typeof place.lat === "number" ? place.lat : null,
    lng: typeof place.lng === "number" ? place.lng : null,
    note: place.notes || null,
  };
}

function visaNotes(nepal: CitiesFile["nepal"]): NomadNote[] {
  const visa = nepal?.visa;
  if (!visa) return [];
  const notes: NomadNote[] = [];
  const tourist = visa.tourist_visa;
  if (tourist?.fees_usd?.length) {
    const fees = tourist.fees_usd.map((row) => `${row.days} days USD ${row.fee}`).join("; ");
    const extra = [tourist.extension, tourist.late_fine && `Late fine ${tourist.late_fine}.`, tourist.annual_maximum]
      .filter(Boolean)
      .join(" ");
    notes.push({ title: "Tourist visa", body: `On arrival. ${fees}. ${extra}`.trim() });
  }
  if (tourist?.process) notes.push({ title: "Arrival", body: tourist.process });
  if (visa.work_rules_note) notes.push({ title: "Work", body: visa.work_rules_note });
  if (visa.residential_visa_note) notes.push({ title: "Residential visa", body: visa.residential_visa_note });
  if (visa.digital_nomad_visa?.summary) {
    notes.push({ title: "Digital nomad visa", body: visa.digital_nomad_visa.summary });
  }
  return notes;
}

function simNotes(nepal: CitiesFile["nepal"]): NomadNote[] {
  return (nepal?.sim ?? []).map((plan) => ({
    title: `${plan.operator} · ${plan.plan}`,
    body: `NPR ${plan.price_npr} for ${plan.validity_days} days, ${plan.data}. As of ${formatUpdated(plan.as_of)}.`,
  }));
}

function toStay(stay: StayJson): NomadStay {
  const basis = stay.nearby_work_basis ?? "";
  return {
    id: stay.id,
    name: stay.name,
    area: stay.area,
    nearestArea: stay.nearest_listed_neighborhood ?? null,
    type: stay.type,
    address: stay.address ?? null,
    lat: typeof stay.lat === "number" ? stay.lat : null,
    lng: typeof stay.lng === "number" ? stay.lng : null,
    geoPrecision: stay.geo_precision,
    approximateDistance: stay.geo_precision === "area" || basis.startsWith("approximate"),
    website: stay.website ?? null,
    bookingUrls: stay.booking_urls ?? [],
    features: stay.nomad_features ?? [],
    price: priceLine(stay.price_note),
    nearbyWork: (stay.nearby_work ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      km: typeof item.km === "number" ? item.km : null,
    })),
  };
}

function buildCity(raw: CityJson): NomadCity {
  const pack = staysFile.cities[raw.slug];
  const areas = (pack?.best_areas_to_live ?? []).map((area) => ({
    name: area.name,
    description: area.description ?? "",
    suits: area.suits ?? [],
    lat: typeof area.center?.lat === "number" ? area.center.lat : null,
    lng: typeof area.center?.lng === "number" ? area.center.lng : null,
    sources: area.sources ?? [],
  }));
  const reference = (raw.stats ?? [])
    .filter((stat) => REFERENCE_LABELS.includes(stat.label))
    .map((stat) => ({ label: stat.label, value: statValue(stat), note: stat.note ?? null }));
  const ookla = raw.internet?.sources?.find((item) => item.url && /ookla/i.test(item.name || ""));
  const seasonBits = [raw.season?.best_months, raw.season?.summary, raw.season?.caveat].filter(
    (item): item is string => Boolean(item),
  );
  const tips = (citiesFile.nepal?.tips ?? [])
    .filter((tip) => !tip.cities?.length || tip.cities.includes(raw.slug))
    .map((tip) => ({ title: tip.topic.replaceAll("_", " "), body: tip.tip }));

  return {
    slug: raw.slug,
    name: raw.name,
    blurb: raw.hero_blurb ?? "",
    reference,
    ookla: ookla?.url ? { label: ookla.name || "Ookla", url: ookla.url } : null,
    areas,
    stays: (pack?.stays ?? []).map(toStay),
    coworking: (raw.coworking ?? []).map(workPlace),
    cafes: (raw.cafes ?? []).map(workPlace),
    visa: visaNotes(citiesFile.nepal),
    sim: simNotes(citiesFile.nepal),
    season: seasonBits.length ? [{ title: "Season", body: seasonBits.join(" ") }] : [],
    tips,
    osmCredit: staysFile.method?.osm_attribution ?? null,
  };
}

export const nomadCities: NomadCity[] = citiesFile.cities.map(buildCity);

export function getNomadCity(slug: string): NomadCity | null {
  return nomadCities.find((city) => city.slug === slug) ?? null;
}

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
