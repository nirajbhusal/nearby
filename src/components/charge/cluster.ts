import type { NearbyStation } from "@/lib/nepal/ev";

export function stackKey(station: { lat: number; lng: number }): string {
  return `${station.lat.toFixed(5)},${station.lng.toFixed(5)}`;
}

/** Spread pins that share a coordinate by `meters` around the shared point. */
export function spiderLatLng(
  lat: number,
  lng: number,
  index: number,
  count: number,
  meters: number,
): { lat: number; lng: number } {
  if (count < 2 || meters <= 0) return { lat, lng };
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;
  const dLat = (meters * Math.cos(angle)) / 111320;
  const cos = Math.cos((lat * Math.PI) / 180) || 1;
  const dLng = (meters * Math.sin(angle)) / (111320 * cos);
  return { lat: lat + dLat, lng: lng + dLng };
}

export type StationPin = { kind: "station"; station: NearbyStation };
export type ClusterPin = {
  kind: "cluster";
  id: string;
  lat: number;
  lng: number;
  count: number;
  fast: number;
  stations: NearbyStation[];
};
export type MapPin = StationPin | ClusterPin;

/** One bubble per city. A lone station stays its own pin. */
export function clusterByCity(stations: NearbyStation[]): MapPin[] {
  const groups = new Map<string, NearbyStation[]>();
  for (const station of stations) {
    const name = station.city?.trim() || "Other";
    const list = groups.get(name);
    if (list) list.push(station);
    else groups.set(name, [station]);
  }
  const pins: MapPin[] = [];
  for (const [name, group] of groups) {
    if (group.length === 1) {
      pins.push({ kind: "station", station: group[0] });
      continue;
    }
    let lat = 0;
    let lng = 0;
    let fast = 0;
    for (const station of group) {
      lat += station.lat;
      lng += station.lng;
      if (station.speed === "fast") fast += 1;
    }
    pins.push({
      kind: "cluster",
      id: `city:${name}`,
      lat: lat / group.length,
      lng: lng / group.length,
      count: group.length,
      fast,
      stations: group,
    });
  }
  return pins;
}

/** Grid clusters while zoomed out. Cells shrink in steps so groups break up as you zoom. */
export function clusterStations(stations: NearbyStation[], zoom: number): MapPin[] {
  if (zoom >= 12.2 || stations.length < 2) {
    return stations.map((station) => ({ kind: "station", station }));
  }
  const divisor = zoom < 8 ? 4.2 : zoom < 10 ? 7 : zoom < 11.2 ? 10 : 14;
  const cell = 360 / 2 ** zoom / divisor;
  const groups = new Map<string, NearbyStation[]>();
  for (const station of stations) {
    const key = `${Math.floor(station.lat / cell)}:${Math.floor(station.lng / cell)}`;
    const list = groups.get(key);
    if (list) list.push(station);
    else groups.set(key, [station]);
  }

  const pins: MapPin[] = [];
  for (const [id, group] of groups) {
    if (group.length === 1) {
      pins.push({ kind: "station", station: group[0] });
      continue;
    }
    let lat = 0;
    let lng = 0;
    let fast = 0;
    for (const station of group) {
      lat += station.lat;
      lng += station.lng;
      if (station.speed === "fast") fast += 1;
    }
    pins.push({
      kind: "cluster",
      id,
      lat: lat / group.length,
      lng: lng / group.length,
      count: group.length,
      fast,
      stations: group,
    });
  }
  return pins;
}
