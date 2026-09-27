import { haversineKm } from "@/lib/geo";
import { defaultRadiusKm } from "@/lib/nepal/places";
import type { EvIndexStation, PlaceHit, PlaceKind } from "@/lib/nepal/types";
import indexJson from "@/data/nepal/ev-index.json";

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
  network: string | null;
};

export function emptyEvFilters(origin: PlaceHit): EvFilters {
  return {
    radiusKm: defaultRadiusKm(origin),
    fastOnly: false,
    plugs: [],
    network: null,
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

function matchesNetwork(station: EvIndexStation, network: string | null): boolean {
  if (!network) return true;
  if (network === "unbranded") return !station.network;
  return station.network === network;
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
    if (!matchesNetwork(station, filters.network)) return false;
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
    network: null,
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
  return (filters.fastOnly ? 1 : 0) + filters.plugs.length + (filters.network ? 1 : 0);
}

export function networkLabel(network: string | null): string {
  return network || "Unbranded";
}

const NETWORK_MONOGRAMS: Record<string, string> = {
  NEA: "NEA",
  "MAW Vriddhi": "MAW",
  CG: "CG",
  GadiCharge: "GC",
};

/** Short mark for the row icon. Known networks stay stable; others use initials. */
export function networkMonogram(network: string | null): string | null {
  if (!network) return null;
  const known = NETWORK_MONOGRAMS[network];
  if (known) return known;
  const words = network.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
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

/** Distance when a location or city is set; otherwise A–Z inside each province. */
export function defaultStationSort(kind: PlaceKind): StationSort {
  if (kind === "geolocation" || kind === "city" || kind === "area" || kind === "district") return "nearest";
  return "az";
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
