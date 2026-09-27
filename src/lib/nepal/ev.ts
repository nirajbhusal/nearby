import { haversineKm } from "@/lib/geo";
import { defaultRadiusKm } from "@/lib/nepal/places";
import { isApproximatePlace, networkById, networkMonogram } from "@/lib/nepal/networks";
import type { EvIndexStation, PlaceHit, PlaceKind } from "@/lib/nepal/types";
import indexJson from "@/data/nepal/ev-index.json";

export { networkMonogram };

export const evIndex = indexJson as EvIndexStation[];

export type NearbyStation = EvIndexStation & { distanceKm: number };

export type PlugFilter = "ccs2" | "gbt" | "t2" | "chademo";

export const PLUG_FILTERS: { id: PlugFilter; label: string }[] = [
  { id: "ccs2", label: "CCS2" },
  { id: "gbt", label: "GB/T" },
  { id: "t2", label: "Type 2" },
  { id: "chademo", label: "CHAdeMO" },
];

export type EvFilters = {
  radiusKm: number | null;
  fastOnly: boolean;
  plugs: PlugFilter[];
  networks: string[];
  exactOnly: boolean;
};

export function emptyEvFilters(origin: PlaceHit): EvFilters {
  return {
    radiusKm: defaultRadiusKm(origin),
    fastOnly: false,
    plugs: [],
    networks: [],
    exactOnly: false,
  };
}

const CONNECTOR_ORDER = [
  "CCS2",
  "GB/T DC",
  "CHAdeMO",
  "Type 2",
  "GB/T AC",
  "Other",
];

export function connectorRank(type: string): number {
  const index = CONNECTOR_ORDER.indexOf(type);
  return index === -1 ? CONNECTOR_ORDER.length : index;
}

function matchesNetwork(station: EvIndexStation, networks: string[]): boolean {
  if (!networks.length) return true;
  const id = station.network_id || "unbranded";
  return networks.includes(id);
}

export function isApproximate(station: { geo_precision: string | null }): boolean {
  return isApproximatePlace(station.geo_precision);
}

export function plugMatches(station: EvIndexStation, plug: PlugFilter): boolean {
  return station.plugs.some((item) => {
    if (plug === "ccs2") return item.type === "CCS2";
    if (plug === "gbt") return item.type === "GB/T DC" || item.type === "GB/T AC";
    if (plug === "t2") return item.type === "Type 2";
    return /chademo/i.test(item.type);
  });
}

export function matchesPlugs(station: EvIndexStation, plugs: PlugFilter[]): boolean {
  if (!plugs.length) return true;
  return plugs.some((plug) => plugMatches(station, plug));
}

function inScope(
  origin: PlaceHit,
  station: NearbyStation,
  radiusKm: number | null
): boolean {
  if (origin.kind === "province" && origin.province) {
    return station.province === origin.province;
  }
  if (radiusKm == null) return true;
  if (station.distanceKm <= radiusKm) return true;
  if (
    origin.kind === "district" &&
    origin.district &&
    station.district === origin.district
  ) {
    return true;
  }
  if (origin.kind === "city" && origin.city && station.city === origin.city) {
    return true;
  }
  return false;
}

export function stationsNear(
  origin: PlaceHit,
  filters: EvFilters
): NearbyStation[] {
  const rows: NearbyStation[] = evIndex.map((station) => ({
    ...station,
    distanceKm: haversineKm(origin.lat, origin.lng, station.lat, station.lng),
  }));

  const filtered = rows.filter((station) => {
    if (!inScope(origin, station, filters.radiusKm)) return false;
    if (filters.fastOnly && station.speed !== "fast") return false;
    if (!matchesPlugs(station, filters.plugs)) return false;
    if (!matchesNetwork(station, filters.networks)) return false;
    if (filters.exactOnly && isApproximate(station)) return false;
    return true;
  });

  const broad = origin.kind === "country" || origin.kind === "province";
  filtered.sort((a, b) => {
    if (broad) {
      const speed = Number(b.speed === "fast") - Number(a.speed === "fast");
      if (speed !== 0) return speed;
      return a.name.localeCompare(b.name);
    }
    return a.distanceKm - b.distanceKm || a.name.localeCompare(b.name);
  });
  return filtered;
}

/** Stations inside the place and radius, before connector, speed, and network chips. */
export function stationsInScope(
  origin: PlaceHit,
  radiusKm: number | null
): NearbyStation[] {
  return stationsNear(origin, {
    radiusKm,
    fastOnly: false,
    plugs: [],
    networks: [],
    exactOnly: false,
  });
}

export function maxKw(station: EvIndexStation): number | null {
  let max: number | null = null;
  for (const plug of station.plugs) {
    if (plug.kw != null && (max == null || plug.kw > max)) max = plug.kw;
  }
  return max;
}

/** Short label drawn on a pin once the map is zoomed in. */
export function pinHint(station: EvIndexStation): string {
  const kw = maxKw(station);
  if (kw != null) return Number.isInteger(kw) ? String(kw) : String(Math.round(kw));
  const type = station.plugs[0]?.type;
  if (!type) return "";
  if (type === "CCS2") return "CCS";
  if (type.startsWith("GB/T")) return "GBT";
  if (type === "Type 2") return "T2";
  if (/chademo/i.test(type)) return "CH";
  return "";
}

export function activeFilterCount(filters: EvFilters): number {
  return (
    (filters.fastOnly ? 1 : 0) +
    filters.plugs.length +
    filters.networks.length +
    (filters.exactOnly ? 1 : 0)
  );
}

export function networkLabel(network: string | null): string {
  return network || "Unbranded";
}

const GENERIC_PREFIX =
  "fast\\s+charging(?:\\s+station)?|dc\\s+charging(?:\\s+station)?|ev\\s+(?:charging\\s+)?station|charging\\s+station|charge\\s*points?|chargepoint|charging";

/** Place name for a list row. The sheet still shows `station.name`. */
export function stationPlaceName(station: {
  name: string;
  network: string | null;
  network_id?: string | null;
}): string {
  const name = station.name.trim();
  const record = networkById(station.network_id);
  const labels = [station.network, record?.name, record?.short, ...(record?.aliases ?? [])].filter(
    (label): label is string => Boolean(label && label.trim()),
  );
  const unique = [...new Set(labels.map((label) => label.trim()))].sort((a, b) => b.length - a.length);
  for (const label of unique) {
    const stripped = stripNetworkPrefix(name, label);
    if (stripped) return stripped;
  }
  return name;
}

function stripNetworkPrefix(name: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const head = new RegExp(`^${escaped}\\b`, "i");
  const matched = head.exec(name);
  if (!matched) return null;
  const rest = name.slice(matched[0].length);
  const immediate = /^\s*[-–—:,]\s*(.+)$/.exec(rest);
  if (immediate?.[1]?.trim()) return immediate[1].trim();
  const generic = new RegExp(`^\\s+(?:${GENERIC_PREFIX})\\b\\s*[-–—:,]?\\s*(.*)$`, "i").exec(rest);
  const genericRest = generic?.[1]?.trim();
  if (genericRest && genericRest.length >= 2) return genericRest;
  const branded =
    /^(?:\s+(?:power|ez|charge|charging|fast|station|stations|ev|dc|motors?|network|points?)){1,6}\s*[-–—:]\s+(.+)$/i.exec(
      rest,
    );
  const brandedRest = branded?.[1]?.trim();
  if (brandedRest && brandedRest.length >= 2) return brandedRest;
  return null;
}

function trimKw(kw: number): string {
  return Number.isInteger(kw) ? String(kw) : String(Math.round(kw * 10) / 10);
}

function plugLabel(type: string): string {
  if (type === "GB/T DC") return "GB/T";
  if (type === "GB/T AC") return "GB/T AC";
  return type;
}

/** Compact connector line, keeping the highest kW for each plug. */
export function connectorLine(station: EvIndexStation): string {
  const best = new Map<string, number | null>();
  for (const plug of station.plugs) {
    const label = plugLabel(plug.type);
    const prev = best.get(label);
    if (prev === undefined) best.set(label, plug.kw);
    else if (plug.kw != null && (prev == null || plug.kw > prev)) best.set(label, plug.kw);
  }
  return [...best.entries()]
    .map(([label, kw]) => (kw != null ? `${label} ${trimKw(kw)} kW` : label))
    .join(" · ");
}

export function stationArea(station: EvIndexStation): string {
  const raw = station.address || "";
  const parts = raw
    .split(",")
    .map((part) => part.replace(/\(.*?\)/g, "").trim())
    .filter((part) => part && !/^nepal$/i.test(part) && !/plus code/i.test(part));
  const street = /\b(marg|road|rd|sadak|street|path|lane|tole)\b/i;
  const local = parts.filter((part, index) => !(index === 0 && street.test(part)));
  const area = (local.length ? local : parts).slice(-2).join(", ");
  if (area) return area;
  return [station.city, station.district].filter(Boolean).join(", ");
}

export type StationSort = "nearest" | "fastest" | "az";

/** Nearest for Near me, a saved point, or a searched city. A–Z only with no place. */
export function defaultStationSort(kind: PlaceKind): StationSort {
  if (kind === "country" || kind === "province") return "az";
  return "nearest";
}

export function sortStations(rows: NearbyStation[], sort: StationSort): NearbyStation[] {
  const next = rows.slice();
  if (sort === "nearest") {
    next.sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name));
    return next;
  }
  if (sort === "fastest") {
    next.sort((a, b) => (maxKw(b) ?? -1) - (maxKw(a) ?? -1) || a.name.localeCompare(b.name));
    return next;
  }
  next.sort((a, b) => {
    const province = (a.province || "\uffff").localeCompare(b.province || "\uffff");
    if (province !== 0) return province;
    return a.name.localeCompare(b.name);
  });
  return next;
}
