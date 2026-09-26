import { haversineKm } from "@/lib/geo";
import { defaultRadiusKm } from "@/lib/nepal/places";
import type { EvIndexStation, PlaceHit } from "@/lib/nepal/types";
import indexJson from "@/data/nepal/ev-index.json";

export const evIndex = indexJson as EvIndexStation[];

export type NearbyStation = EvIndexStation & { distanceKm: number };

export type SpeedFilter = "all" | "fast" | "slow" | "unknown";

export type EvFilters = {
  radiusKm: number | null;
  speed: SpeedFilter;
  connector: string | null;
  network: string | null;
  province: string | null;
  city: string | null;
};

export function emptyEvFilters(origin: PlaceHit): EvFilters {
  return {
    radiusKm: defaultRadiusKm(origin),
    speed: "all",
    connector: null,
    network: null,
    province: origin.kind === "province" ? origin.province : null,
    city: null,
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

export function stationsNear(
  origin: PlaceHit,
  filters: EvFilters
): NearbyStation[] {
  const rows: NearbyStation[] = evIndex.map((station) => ({
    ...station,
    distanceKm: haversineKm(origin.lat, origin.lng, station.lat, station.lng),
  }));

  const filtered = rows.filter((station) => {
    if (filters.province && station.province !== filters.province) return false;
    if (filters.city && station.city !== filters.city) return false;
    if (filters.speed !== "all" && station.speed !== filters.speed) return false;
    if (
      filters.connector &&
      !station.plugs.some((plug) => plug.type === filters.connector)
    ) {
      return false;
    }
    if (!matchesNetwork(station, filters.network)) return false;

    if (filters.radiusKm == null) return true;
    if (station.distanceKm <= filters.radiusKm) return true;
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
  });

  filtered.sort(
    (a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name)
  );
  return filtered;
}

/** Stations inside the place and radius, before connector, speed, network, and city chips. */
export function stationsInScope(
  origin: PlaceHit,
  radiusKm: number | null,
  province: string | null
): NearbyStation[] {
  return stationsNear(origin, {
    radiusKm,
    speed: "all",
    connector: null,
    network: null,
    province,
    city: null,
  });
}

export function networkLabel(network: string | null): string {
  return network || "Unbranded";
}
