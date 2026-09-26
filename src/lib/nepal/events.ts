import { ktmDay } from "@/lib/nepal/format";
import { distanceKm, isNearRecord, isOnlinePlace } from "@/lib/nepal/places";
import type { NepalEvent, PlaceHit } from "@/lib/nepal/types";
import eventsJson from "@/data/nepal/events.json";

export const nepalEvents = eventsJson as NepalEvent[];

export type EventTiming = "upcoming" | "past" | "recurring";

export type NearbyNepalEvent = {
  event: NepalEvent;
  distanceKm: number | null;
  timing: EventTiming;
  online: boolean;
};

/**
 * Dated events are upcoming or past from `now`.
 * Rows with no start date stay in the recurring group.
 * Before the clock is available, `status` is only a placeholder.
 */
export function eventTiming(event: NepalEvent, now: Date | null): EventTiming {
  if (!event.start_date) return "recurring";
  if (!now) {
    if (event.status === "past") return "past";
    if (event.status === "recurring_series") return "recurring";
    return "upcoming";
  }
  if (event.end_date) {
    return new Date(event.end_date).getTime() < now.getTime() ? "past" : "upcoming";
  }
  const start = new Date(event.start_date);
  return ktmDay(start) < ktmDay(now) ? "past" : "upcoming";
}

export function eventsNear(
  origin: PlaceHit,
  options: { type: string | null; freeOnly: boolean },
  now: Date | null
): {
  upcoming: NearbyNepalEvent[];
  past: NearbyNepalEvent[];
  recurring: NearbyNepalEvent[];
  online: NearbyNepalEvent[];
} {
  const upcoming: NearbyNepalEvent[] = [];
  const past: NearbyNepalEvent[] = [];
  const recurring: NearbyNepalEvent[] = [];
  const online: NearbyNepalEvent[] = [];

  for (const event of nepalEvents) {
    if (options.type && event.type !== options.type) continue;
    if (options.freeOnly && event.free !== true) continue;
    const timing = eventTiming(event, now);
    const row: NearbyNepalEvent = {
      event,
      distanceKm: distanceKm(origin, event),
      timing,
      online: isOnlinePlace(event.city),
    };
    if (row.online) {
      online.push(row);
      continue;
    }
    if (timing !== "recurring" && !isNearRecord(origin, event)) continue;
    if (timing === "recurring" && !isNearRecord(origin, event)) continue;
    if (timing === "upcoming") upcoming.push(row);
    else if (timing === "past") past.push(row);
    else recurring.push(row);
  }

  const byStart = (a: NearbyNepalEvent, b: NearbyNepalEvent) => {
    const aTime = a.event.start_date ? new Date(a.event.start_date).getTime() : 0;
    const bTime = b.event.start_date ? new Date(b.event.start_date).getTime() : 0;
    return aTime - bTime;
  };

  upcoming.sort(byStart);
  past.sort((a, b) => byStart(b, a));
  recurring.sort((a, b) => a.event.title.localeCompare(b.event.title));
  online.sort((a, b) => {
    if (a.timing !== b.timing) {
      const order = { upcoming: 0, recurring: 1, past: 2 };
      return order[a.timing] - order[b.timing];
    }
    return byStart(a, b);
  });

  return { upcoming, past, recurring, online };
}

export const EVENT_TYPE_FILTERS = [
  "meetup",
  "hackathon",
  "conference",
  "workshop",
  "networking",
  "talk",
  "other",
] as const;
