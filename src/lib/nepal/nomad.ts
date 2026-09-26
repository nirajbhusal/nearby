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
  note: string | null;
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

const SHORT_NAME: Record<string, string> = {
  kathmandu: "Kathmandu",
  pokhara: "Pokhara",
};

const HEADLINE: Record<string, string> = {
  kathmandu:
    "Nepal's capital and its sister city Patan: cafés, coworking and mountain views, from about $908 a month.",
  pokhara:
    "Beside Phewa Lake, where most Annapurna treks begin: lakeside cafés and quieter side streets, from about $1,030 a month.",
};

/** Plain-language area lines, paraphrased from the cited neighbourhood notes. */
const AREA_COPY: Record<string, { blurb: string; tags: string[] }> = {
  Thamel: {
    blurb:
      "The backpacker centre, a traffic-free maze of guesthouses and cafés. Most tourist stays are here, and it is loud.",
    tags: ["Central", "Cafés", "Busy"],
  },
  "Jhamsikhel / Sanepa (Lalitpur)": {
    blurb: "Quieter than Thamel, with the valley’s densest stretch of remote-work cafés along Jhamel.",
    tags: ["Cafés", "Quieter", "Expat area"],
  },
  "Patan Durbar area (Lalitpur)": {
    blurb: "About 4 km from Thamel, around the UNESCO Durbar Square. More space, and home to many INGOs.",
    tags: ["Heritage", "Calmer", "Patan"],
  },
  "Boudha (Boudhanath)": {
    blurb: "East of the centre, around the great stupa and its monasteries. Calm, and often better value.",
    tags: ["Calm", "Spiritual", "Good value"],
  },
  Lazimpat: {
    blurb: "The embassy and hotel strip in central Kathmandu, a short walk from Thamel.",
    tags: ["Central", "Hotels", "Walkable"],
  },
  Baluwatar: {
    blurb: "A quiet residential neighbourhood with cafés, next to the government quarter.",
    tags: ["Quiet", "Residential"],
  },
  Lakeside: {
    blurb: "The main strip along Phewa Lake, with cafés and live music. Busy, and where most visitors stay.",
    tags: ["Lake", "Cafés", "Walkable"],
  },
  "Baidam (Lakeside East)": {
    blurb: "The eastern side streets of Lakeside. Quieter than the main road, and still a short walk to the lake.",
    tags: ["Quieter", "Apartments", "Lake"],
  },
  "Khahare (North Lakeside)": {
    blurb: "The north end of Lakeside, a little higher, with lake views and simpler stays.",
    tags: ["Lake views", "Quieter", "Budget"],
  },
  Sarangkot: {
    blurb: "The hill above the lake, for sunrise over the Annapurnas. Cleaner air, and a walk from the cafés.",
    tags: ["Mountain views", "Quiet"],
  },
  Damside: {
    blurb: "The other tourist shore of Phewa Lake, with hotels along Damside Marg.",
    tags: ["Lake", "Hotels"],
  },
};

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

function shortPrice(note: StayJson["price_note"]): string | null {
  const text = note?.text?.trim();
  if (!text) return null;
  const amount = text.match(/(?:USD|NPR)\s[\d,]+(?:[–-][\d,]+)?(?:\/(?:night|month))?/i);
  const bit = amount?.[0] ?? text.split(/[.;]/)[0]?.trim() ?? text;
  return bit.length > 42 ? `${bit.slice(0, 39).trim()}…` : bit;
}

function workNearbyLine(links: NomadWorkLink[], approximate: boolean): string | null {
  const measured = links.filter((item) => item.km != null);
  if (measured.length === 0) return null;
  const about = approximate ? "about " : "";
  const cowork = measured.filter((item) => item.kind === "coworking" && (item.km ?? 99) <= 1);
  if (cowork.length > 0) {
    return `${cowork.length} coworking space${cowork.length === 1 ? "" : "s"} within ${about}1 km`;
  }
  const close = measured.filter((item) => (item.km ?? 99) <= 1);
  if (close.length > 0) {
    return `${close.length} place${close.length === 1 ? "" : "s"} to work within ${about}1 km`;
  }
  const nearest = [...measured].sort((a, b) => (a.km ?? 99) - (b.km ?? 99))[0];
  if (!nearest || nearest.km == null) return null;
  const km = nearest.km < 10 ? nearest.km.toFixed(1) : String(Math.round(nearest.km));
  return `Nearest work ${about}${km} km`;
}

function toStay(stay: StayJson): NomadStay {
  const basis = stay.nearby_work_basis ?? "";
  const approximateDistance = stay.geo_precision === "area" || basis.startsWith("approximate");
  const nearbyWork = (stay.nearby_work ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    km: typeof item.km === "number" ? item.km : null,
  }));
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
    approximateDistance,
    website: stay.website ?? null,
    bookingUrls: stay.booking_urls ?? [],
    features: stay.nomad_features ?? [],
    price: priceLine(stay.price_note),
    priceShort: shortPrice(stay.price_note),
    workLine: workNearbyLine(nearbyWork, approximateDistance),
    nearbyWork,
  };
}

function buildCity(raw: CityJson): NomadCity {
  const pack = staysFile.cities[raw.slug];
  const areas = (pack?.best_areas_to_live ?? []).map((area) => {
    const written = AREA_COPY[area.name];
    const tags = (written?.tags ?? area.suits ?? []).slice(0, 3);
    return {
      name: area.name,
      blurb: written?.blurb ?? "",
      tags,
      lat: typeof area.center?.lat === "number" ? area.center.lat : null,
      lng: typeof area.center?.lng === "number" ? area.center.lng : null,
      sources: area.sources ?? [],
    };
  });
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

  const rank = raw.stats?.find((stat) => stat.label === "Nomads.com rank");
  const cost = raw.stats?.find((stat) => stat.label === "Cost of living for nomad");
  const internet = raw.stats?.find((stat) => stat.label === "Internet speed (avg)");
  const asOf = rank?.as_of ? formatUpdated(rank.as_of) : "26 Sep 2026";
  const costText = typeof cost?.value === "number" ? `$${cost.value.toLocaleString("en-US")}/mo` : "";
  const referenceLine = [
    rank ? `#${rank.value} on Nomads.com` : "",
    costText,
    internet ? `${internet.value} Mbps avg` : "",
    `as of ${asOf}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    slug: raw.slug,
    name: raw.name,
    shortName: SHORT_NAME[raw.slug] ?? raw.name,
    headline: HEADLINE[raw.slug] ?? "",
    referenceLine,
    sourceUrl: rank?.source_url ?? cost?.source_url ?? null,
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
