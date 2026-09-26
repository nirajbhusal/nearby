import type { EvStation } from "@/lib/nepal/types";
import stationsJson from "@/data/nepal/ev-stations.json";

const stations = stationsJson as EvStation[];

const byId = new Map(stations.map((station) => [station.id, station]));

export function allStationIds(): string[] {
  return stations.map((station) => station.id);
}

export function getStation(id: string): EvStation | undefined {
  return byId.get(id);
}
