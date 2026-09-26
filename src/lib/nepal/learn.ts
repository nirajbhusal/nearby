import { distanceKm, isNearRecord, isOnlinePlace } from "@/lib/nepal/places";
import type { LearnPlace, PlaceHit } from "@/lib/nepal/types";
import learnJson from "@/data/nepal/learn.json";

export const learnPlaces = learnJson as LearnPlace[];

export type NearbyLearn = {
  place: LearnPlace;
  distanceKm: number | null;
};

export function learnNear(
  origin: PlaceHit,
  options: { type: string | null; mode: string | null }
): { near: NearbyLearn[]; online: NearbyLearn[] } {
  const near: NearbyLearn[] = [];
  const online: NearbyLearn[] = [];

  for (const place of learnPlaces) {
    if (options.type && place.type !== options.type) continue;
    if (options.mode && place.mode !== options.mode) continue;
    const row: NearbyLearn = {
      place,
      distanceKm: distanceKm(origin, place),
    };
    if (isOnlinePlace(place.city) || place.mode === "online" || place.type === "online") {
      online.push(row);
      continue;
    }
    if (!isNearRecord(origin, place)) continue;
    near.push(row);
  }

  const byDistance = (a: NearbyLearn, b: NearbyLearn) => {
    if (a.distanceKm == null && b.distanceKm == null) {
      return a.place.name.localeCompare(b.place.name);
    }
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm || a.place.name.localeCompare(b.place.name);
  };

  near.sort(byDistance);
  online.sort((a, b) => a.place.name.localeCompare(b.place.name));
  return { near, online };
}

export function learnTypes(): string[] {
  return [...new Set(learnPlaces.map((place) => place.type))].sort();
}
