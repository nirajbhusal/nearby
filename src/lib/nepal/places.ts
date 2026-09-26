import { phraseOverlaps } from "@/lib/place-match";
import { haversineKm } from "@/lib/geo";
import type { PlaceHit, PlaceKind } from "@/lib/nepal/types";
import placesJson from "@/data/nepal/places.json";

type CityRow = {
  name: string;
  lat: number;
  lng: number;
  district: string | null;
  province: string | null;
};

type DistrictRow = {
  name: string;
  lat: number;
  lng: number;
  province: string | null;
};

type ProvinceRow = {
  name: string;
  lat: number;
  lng: number;
};

type AreaRow = {
  name: string;
  lat: number;
  lng: number;
  city: string;
};

const cities = placesJson.cities as CityRow[];
const districts = placesJson.districts as DistrictRow[];
const provinces = placesJson.provinces as ProvinceRow[];

/** Neighbourhoods and landmarks that are not their own municipality in the data. */
const AREAS: AreaRow[] = [
  { name: "Thamel", lat: 27.7154, lng: 85.3123, city: "Kathmandu" },
  { name: "Durbar Marg", lat: 27.7118, lng: 85.3178, city: "Kathmandu" },
  { name: "New Baneshwor", lat: 27.6915, lng: 85.342, city: "Kathmandu" },
  { name: "Baneshwor", lat: 27.693, lng: 85.335, city: "Kathmandu" },
  { name: "Koteshwor", lat: 27.679, lng: 85.349, city: "Kathmandu" },
  { name: "Kalanki", lat: 27.6932, lng: 85.2818, city: "Kathmandu" },
  { name: "Kalimati", lat: 27.698, lng: 85.299, city: "Kathmandu" },
  { name: "Balaju", lat: 27.7305, lng: 85.3045, city: "Kathmandu" },
  { name: "Maharajgunj", lat: 27.7365, lng: 85.3305, city: "Kathmandu" },
  { name: "Boudha", lat: 27.7215, lng: 85.362, city: "Kathmandu" },
  { name: "Chabahil", lat: 27.7175, lng: 85.3465, city: "Kathmandu" },
  { name: "Gongabu", lat: 27.735, lng: 85.3155, city: "Kathmandu" },
  { name: "Lazimpat", lat: 27.7215, lng: 85.3225, city: "Kathmandu" },
  { name: "Basantapur", lat: 27.7042, lng: 85.307, city: "Kathmandu" },
  { name: "Swayambhu", lat: 27.7149, lng: 85.2903, city: "Kathmandu" },
  { name: "Jorpati", lat: 27.73, lng: 85.376, city: "Kathmandu" },
  { name: "Putalisadak", lat: 27.7055, lng: 85.3235, city: "Kathmandu" },
  { name: "Naxal", lat: 27.716, lng: 85.33, city: "Kathmandu" },
  { name: "Maitidevi", lat: 27.7055, lng: 85.3355, city: "Kathmandu" },
  { name: "Gwarko", lat: 27.6663, lng: 85.3315, city: "Lalitpur" },
  { name: "Satdobato", lat: 27.6585, lng: 85.3245, city: "Lalitpur" },
  { name: "Lagankhel", lat: 27.666, lng: 85.3235, city: "Lalitpur" },
  { name: "Jawalakhel", lat: 27.673, lng: 85.3135, city: "Lalitpur" },
  { name: "Pulchowk", lat: 27.6815, lng: 85.318, city: "Lalitpur" },
  { name: "Kupondole", lat: 27.6875, lng: 85.3125, city: "Lalitpur" },
  { name: "Sanepa", lat: 27.6845, lng: 85.306, city: "Lalitpur" },
  { name: "Ekantakuna", lat: 27.6665, lng: 85.3105, city: "Lalitpur" },
  { name: "Imadol", lat: 27.664, lng: 85.345, city: "Lalitpur" },
  { name: "Suryabinayak", lat: 27.658, lng: 85.428, city: "Bhaktapur" },
  { name: "Sallaghari", lat: 27.672, lng: 85.41, city: "Bhaktapur" },
  { name: "Lakeside", lat: 28.2096, lng: 83.9556, city: "Pokhara" },
  { name: "Mahendrapul", lat: 28.2125, lng: 83.9855, city: "Pokhara" },
  { name: "Damside", lat: 28.2045, lng: 83.9605, city: "Pokhara" },
  { name: "Sauraha", lat: 27.583, lng: 84.496, city: "Ratnanagar" },
  { name: "Nagarkot", lat: 27.715, lng: 85.521, city: "Changunarayan" },
];

const ALIASES: Record<string, { kind: PlaceKind; name: string }> = {
  patan: { kind: "city", name: "Lalitpur" },
  ktm: { kind: "city", name: "Kathmandu" },
  pokhra: { kind: "city", name: "Pokhara" },
  bhairahawa: { kind: "city", name: "Siddharthanagar" },
  bhairawa: { kind: "city", name: "Siddharthanagar" },
  narayanghat: { kind: "city", name: "Bharatpur" },
  narayangarh: { kind: "city", name: "Bharatpur" },
  mahendranagar: { kind: "city", name: "Bhimdatta" },
  dhangadi: { kind: "city", name: "Dhangadhi" },
  nepalganj: { kind: "city", name: "Nepalgunj" },
  birganj: { kind: "city", name: "Birgunj" },
  hetuada: { kind: "city", name: "Hetauda" },
  thimi: { kind: "city", name: "Madhyapur Thimi" },
  chitawan: { kind: "district", name: "Chitwan" },
  chitwan: { kind: "district", name: "Chitwan" },
  kaski: { kind: "district", name: "Kaski" },
  "kathmandu valley": { kind: "city", name: "Kathmandu" },
  "the valley": { kind: "city", name: "Kathmandu" },
  boudhanath: { kind: "area", name: "Boudha" },
  swayambhunath: { kind: "area", name: "Swayambhu" },
  durbarmarg: { kind: "area", name: "Durbar Marg" },
  "durbar marg": { kind: "area", name: "Durbar Marg" },
  "new baneshwor": { kind: "area", name: "New Baneshwor" },
  baneshwor: { kind: "area", name: "Baneshwor" },
  jawalakhel: { kind: "area", name: "Jawalakhel" },
  kupondol: { kind: "area", name: "Kupondole" },
  lakeside: { kind: "area", name: "Lakeside" },
  phewa: { kind: "area", name: "Lakeside" },
  sauraha: { kind: "area", name: "Sauraha" },
  nagarkot: { kind: "area", name: "Nagarkot" },
  sudurpaschim: { kind: "province", name: "Sudurpashchim" },
  "sudur pashchim": { kind: "province", name: "Sudurpashchim" },
  "far west": { kind: "province", name: "Sudurpashchim" },
  "far western": { kind: "province", name: "Sudurpashchim" },
};

const CITY_EQUIV: Record<string, string> = {
  patan: "lalitpur",
  bhairahawa: "siddharthanagar",
  bhairawa: "siddharthanagar",
  narayanghat: "bharatpur",
  narayangarh: "bharatpur",
  mahendranagar: "bhimdatta",
  thimi: "madhyapur thimi",
  dhangadi: "dhangadhi",
  nepalganj: "nepalgunj",
  birganj: "birgunj",
  hetuada: "hetauda",
  pokhra: "pokhara",
};

export function normalizePlace(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function canonicalCity(name: string): string {
  const n = normalizePlace(name).replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return CITY_EQUIV[n] ?? n;
}

export function sameCity(a: string, b: string): boolean {
  return canonicalCity(a) === canonicalCity(b);
}

export function isOnlinePlace(city: string | null | undefined): boolean {
  if (!city) return false;
  const c = normalizePlace(city);
  return c === "online" || c === "remote";
}

const cityByKey = new Map<string, CityRow>();
for (const city of cities) {
  cityByKey.set(canonicalCity(city.name), city);
  cityByKey.set(normalizePlace(city.name), city);
}

const districtByKey = new Map<string, DistrictRow>();
for (const district of districts) {
  districtByKey.set(normalizePlace(district.name), district);
}

const provinceByKey = new Map<string, ProvinceRow>();
for (const province of provinces) {
  provinceByKey.set(normalizePlace(province.name), province);
}

const areaByKey = new Map<string, AreaRow>();
for (const area of AREAS) {
  areaByKey.set(normalizePlace(area.name), area);
}

export function lookupCity(name: string | null | undefined): CityRow | null {
  if (!name) return null;
  return (
    cityByKey.get(canonicalCity(name)) ??
    cityByKey.get(normalizePlace(name).replace(/\s*\([^)]*\)\s*/g, " ").trim()) ??
    null
  );
}

function hitFromCity(row: CityRow, label = row.name): PlaceHit {
  return {
    label,
    lat: row.lat,
    lng: row.lng,
    kind: "city",
    city: row.name,
    district: row.district,
    province: row.province,
  };
}

function hitFromDistrict(row: DistrictRow): PlaceHit {
  return {
    label: row.name,
    lat: row.lat,
    lng: row.lng,
    kind: "district",
    city: null,
    district: row.name,
    province: row.province,
  };
}

function hitFromProvince(row: ProvinceRow): PlaceHit {
  return {
    label: row.name,
    lat: row.lat,
    lng: row.lng,
    kind: "province",
    city: null,
    district: null,
    province: row.name,
  };
}

function hitFromArea(row: AreaRow): PlaceHit {
  const parent = lookupCity(row.city);
  return {
    label: row.name,
    lat: row.lat,
    lng: row.lng,
    kind: "area",
    city: parent?.name ?? row.city,
    district: parent?.district ?? null,
    province: parent?.province ?? null,
  };
}

function resolveNamed(
  kind: PlaceKind,
  name: string
): PlaceHit | null {
  const key = normalizePlace(name);
  if (kind === "area") {
    const area = areaByKey.get(key);
    return area ? hitFromArea(area) : null;
  }
  if (kind === "city") {
    const city = cityByKey.get(canonicalCity(name)) ?? cityByKey.get(key);
    return city ? hitFromCity(city) : null;
  }
  if (kind === "district") {
    const district = districtByKey.get(key);
    return district ? hitFromDistrict(district) : null;
  }
  if (kind === "province") {
    const province = provinceByKey.get(key);
    return province ? hitFromProvince(province) : null;
  }
  return null;
}

function resolveExact(query: string): PlaceHit | null {
  const key = normalizePlace(query);
  const area = areaByKey.get(key);
  if (area) return hitFromArea(area);
  const alias = ALIASES[key];
  if (alias) return resolveNamed(alias.kind, alias.name);
  const city = cityByKey.get(key);
  if (city) return hitFromCity(city);
  const district = districtByKey.get(key);
  if (district) return hitFromDistrict(district);
  const province = provinceByKey.get(key);
  if (province) return hitFromProvince(province);
  return null;
}

function uniquePrefix(
  query: string,
  rows: { key: string; hit: PlaceHit }[]
): PlaceHit | null {
  if (query.length < 4) return null;
  const hits = rows.filter((row) => row.key.startsWith(query));
  if (hits.length === 1) return hits[0].hit;
  return null;
}

function resolveFuzzy(query: string): PlaceHit | null {
  const key = normalizePlace(query);
  const lists: { key: string; hit: PlaceHit }[][] = [
    AREAS.map((area) => ({ key: normalizePlace(area.name), hit: hitFromArea(area) })),
    cities.map((city) => ({ key: normalizePlace(city.name), hit: hitFromCity(city) })),
    districts.map((district) => ({
      key: normalizePlace(district.name),
      hit: hitFromDistrict(district),
    })),
    provinces.map((province) => ({
      key: normalizePlace(province.name),
      hit: hitFromProvince(province),
    })),
  ];
  for (const list of lists) {
    const hit = uniquePrefix(key, list);
    if (hit) return hit;
  }
  if (key.length < 5) return null;
  const wordHits: PlaceHit[] = [];
  for (const list of lists) {
    for (const row of list) {
      if (phraseOverlaps(row.key, key)) wordHits.push(row.hit);
    }
  }
  const labels = new Set(wordHits.map((hit) => hit.label));
  if (labels.size === 1) return wordHits[0];
  return null;
}

function queryVariants(raw: string): string[] {
  const q = normalizePlace(raw);
  const variants = new Set<string>();
  const add = (value: string) => {
    const next = value.trim();
    if (next) variants.add(next);
  };
  add(q);
  add(q.replace(/,?\s*nepal$/, ""));
  add(q.replace(/\s+(province|pradesh|district|municipality|metropolitan|metro|city)$/, ""));
  const head = q.split(",")[0]?.trim() ?? q;
  add(head);
  add(head.replace(/\s+(province|pradesh|district|municipality)$/, ""));
  return [...variants];
}

export function resolvePlace(raw: string): PlaceHit | null {
  const variants = queryVariants(raw);
  for (const variant of variants) {
    const exact = resolveExact(variant);
    if (exact) return exact;
  }
  for (const variant of variants) {
    const fuzzy = resolveFuzzy(variant);
    if (fuzzy) return fuzzy;
  }
  return null;
}

export const NEPAL: PlaceHit = {
  label: "Nepal",
  lat: 28.39,
  lng: 84.12,
  kind: "country",
  city: null,
  district: null,
  province: null,
};

export const KATHMANDU: PlaceHit = resolvePlace("Kathmandu") ?? {
  label: "Kathmandu",
  lat: 27.70884,
  lng: 85.32289,
  kind: "city",
  city: "Kathmandu",
  district: "Kathmandu",
  province: "Bagmati",
};

export function defaultRadiusKm(origin: PlaceHit): number | null {
  if (origin.kind === "province" || origin.kind === "country") return null;
  if (origin.kind === "geolocation") return 15;
  if (origin.kind === "district") return 50;
  return 25;
}

/** Jobs, learning, and events use a valley-sized radius around a city. */
export const LOCAL_RADIUS_KM = 30;

export type Locatable = {
  lat: number | null;
  lng: number | null;
  city: string | null;
  district?: string | null;
  province?: string | null;
};

export function distanceKm(origin: PlaceHit, item: Locatable): number | null {
  if (item.lat == null || item.lng == null) return null;
  return haversineKm(origin.lat, origin.lng, item.lat, item.lng);
}

/** Place suggestions for the search field. An empty query returns a short popular list. */
export function suggestPlaces(raw: string, limit = 8): PlaceHit[] {
  const key = normalizePlace(raw);
  const popular = ["Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Butwal"]
    .map((name) => resolvePlace(name))
    .filter((hit): hit is PlaceHit => Boolean(hit));
  if (!key) return popular.slice(0, limit);

  type Scored = { hit: PlaceHit; score: number; label: string };
  const scored: Scored[] = [];
  const consider = (hit: PlaceHit | null, name: string) => {
    if (!hit) return;
    const nameKey = normalizePlace(name);
    let score = 0;
    if (nameKey === key) score = 100;
    else if (nameKey.startsWith(key)) score = 80 - Math.min(nameKey.length, 20);
    else if (nameKey.includes(key)) score = 60;
    else if (key.length >= 3 && phraseOverlaps(nameKey, key)) score = 40;
    else return;
    scored.push({ hit, score, label: name });
  };

  for (const area of AREAS) consider(hitFromArea(area), area.name);
  for (const city of cities) consider(hitFromCity(city), city.name);
  for (const district of districts) consider(hitFromDistrict(district), district.name);
  for (const province of provinces) consider(hitFromProvince(province), province.name);
  for (const [alias, target] of Object.entries(ALIASES)) {
    consider(resolveNamed(target.kind, target.name), alias);
  }

  scored.sort(
    (a, b) => b.score - a.score || a.hit.label.localeCompare(b.hit.label)
  );
  const seen = new Set<string>();
  const hits: PlaceHit[] = [];
  for (const row of scored) {
    const id = `${row.hit.kind}:${row.hit.lat.toFixed(3)}:${row.hit.lng.toFixed(3)}:${row.hit.label}`;
    if (seen.has(id)) continue;
    seen.add(id);
    hits.push(row.hit);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function isNearRecord(origin: PlaceHit, item: Locatable): boolean {
  if (isOnlinePlace(item.city)) return false;
  const city = lookupCity(item.city);
  const district = item.district ?? city?.district ?? null;
  const province = item.province ?? city?.province ?? null;
  if (origin.kind === "province" && origin.province) {
    return province === origin.province;
  }
  if (origin.kind === "district" && origin.district && district === origin.district) {
    return true;
  }
  const distance = distanceKm(origin, item);
  if (distance != null && distance <= LOCAL_RADIUS_KM) return true;
  if (origin.city && item.city && sameCity(origin.city, item.city)) return true;
  return false;
}
