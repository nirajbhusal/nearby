import { phraseOverlaps } from "@/lib/place-match";

export type EventDTO = {
  id: string;
  title: string;
  city: string;
  country: string | null;
  startsAt: string;
  endAt: string | null;
  url: string | null;
  category: string;
  description: string | null;
  source: string;
};

export type NearbyEvent = Omit<EventDTO, "source"> & {
  score: number;
  nearnessLabel: string;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Soft aliases so short names still hit curated meetup cities. */
const CITY_ALIASES: Record<string, string[]> = {
  hcmc: ["ho chi minh city", "saigon"],
  "ho chi minh": ["ho chi minh city", "saigon"],
  "ho chi minh city": ["ho chi minh city", "saigon", "hcmc"],
  saigon: ["ho chi minh city", "saigon"],
  "mexico city": ["mexico city", "cdmx"],
  cdmx: ["mexico city"],
  "los angeles": ["los angeles", "la", "l.a."],
  la: ["los angeles"],
  "kuala lumpur": ["kuala lumpur", "kl"],
  kl: ["kuala lumpur"],
  nyc: ["new york", "new york city"],
  sf: ["san francisco"],
};

function placeTokens(place: string): string[] {
  const p = normalize(place);
  if (!p) return [];
  const aliases = CITY_ALIASES[p];
  if (aliases) return aliases;
  const head = p.split(",")[0]?.trim() ?? p;
  const headAliases = CITY_ALIASES[head];
  return headAliases ?? [p, head].filter(Boolean);
}

export function toEventDTO(e: {
  id: string;
  title: string;
  city: string;
  country: string | null;
  startsAt: Date;
  endAt: Date | null;
  url: string | null;
  category: string;
  description: string | null;
  source: string;
}): EventDTO {
  return {
    id: e.id,
    title: e.title,
    city: e.city,
    country: e.country,
    startsAt: e.startsAt.toISOString(),
    endAt: e.endAt ? e.endAt.toISOString() : null,
    url: e.url,
    category: e.category,
    description: e.description,
    source: e.source,
  };
}

function cityMatchScore(
  city: string,
  place: string
): { score: number; label: string } {
  if (!place.trim()) return { score: 0, label: "" };
  const tokens = placeTokens(place);
  const c = normalize(city);
  const matched = tokens.some((t) => phraseOverlaps(c, t));
  if (matched) {
    const display = place.split(",")[0]?.trim() || place.trim();
    return { score: 100, label: `Near ${display}` };
  }
  return { score: 0, label: "" };
}

function toNearbyEvent(
  e: EventDTO,
  score: number,
  nearnessLabel: string
): NearbyEvent {
  const { source: _s, ...rest } = e;
  return { ...rest, score, nearnessLabel };
}

/**
 * Rank AI meetups by city overlap with `place`.
 * If nothing matches locally, return soonest upcoming meetups (limit)
 * labeled "Upcoming elsewhere".
 */
export function rankNearbyEvents(
  events: EventDTO[],
  place: string,
  limit = 5,
  now: Date = new Date()
): { events: NearbyEvent[]; eventsSummary: string } {
  const placeClean = place.trim();
  const nowMs = now.getTime();

  const local = events
    .map((e) => {
      const match = cityMatchScore(e.city, placeClean);
      return toNearbyEvent(e, match.score, match.label);
    })
    .filter((e) => e.score >= 100)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
        a.city.localeCompare(b.city)
    )
    .slice(0, limit);

  if (local.length > 0) {
    const where = placeClean.split(",")[0]?.trim() || placeClean;
    return {
      events: local,
      eventsSummary:
        local.length === 1
          ? `There’s an AI meetup near ${where}.`
          : `Here are AI meetups near ${where}.`,
    };
  }

  // Fallback: soonest upcoming elsewhere
  const upcoming = events
    .filter((e) => new Date(e.startsAt).getTime() >= nowMs - 12 * 60 * 60 * 1000)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
    .slice(0, limit)
    .map((e) => toNearbyEvent(e, 10, "Upcoming elsewhere"));

  // If everything is in the past, still show the next few chronologically from the list
  const fallback =
    upcoming.length > 0
      ? upcoming
      : [...events]
          .sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
          )
          .slice(-limit)
          .reverse()
          .map((e) => toNearbyEvent(e, 5, "Upcoming elsewhere"));

  return {
    events: fallback,
    eventsSummary: placeClean
      ? `No AI meetup matched ${placeClean.split(",")[0]?.trim() || placeClean} — here are upcoming ones elsewhere.`
      : "Upcoming AI meetups.",
  };
}

/** Next N upcoming events by date (for homepage strip). */
export function upcomingEvents(
  events: EventDTO[],
  limit = 5,
  now: Date = new Date()
): EventDTO[] {
  const nowMs = now.getTime() - 12 * 60 * 60 * 1000;
  return events
    .filter((e) => new Date(e.startsAt).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
    .slice(0, limit);
}
