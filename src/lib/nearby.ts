import type { CompanyDTO } from "@/lib/companies";
import type { NearbyEvent } from "@/lib/events";
import { phraseOverlaps } from "@/lib/place-match";

export type NearbyRecommendation = Omit<CompanyDTO, "source" | "sourceUrl"> & {
  score: number;
  nearnessLabel: string;
};

export type NearbyResult = {
  summary: string;
  place: string;
  intent: string | null;
  recommendations: NearbyRecommendation[];
  events: NearbyEvent[];
  eventsSummary: string;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Soft aliases so "SF" / "NYC" still hit seeded location strings. */
const PLACE_ALIASES: Record<string, string[]> = {
  sf: ["san francisco", "sf bay area", "san mateo", "palo alto"],
  "san francisco": ["san francisco", "sf bay area", "san mateo", "palo alto"],
  "bay area": ["sf bay area", "san francisco", "san mateo", "palo alto"],
  nyc: ["new york city", "new york"],
  "new york": ["new york city", "new york"],
  "new york city": ["new york city"],
  london: ["london", "uk"],
  remote: ["remote", "global"],
};


function toRecommendation(
  c: CompanyDTO,
  score: number,
  nearnessLabel: string
): NearbyRecommendation {
  const { source: _s, sourceUrl: _u, ...rest } = c;
  return { ...rest, score, nearnessLabel };
}

function placeTokens(place: string): string[] {
  const p = normalize(place);
  if (!p) return [];
  const aliases = PLACE_ALIASES[p];
  if (aliases) return aliases;
  // also try first word / city before comma
  const head = p.split(",")[0]?.trim() ?? p;
  const headAliases = PLACE_ALIASES[head];
  return headAliases ?? [p, head].filter(Boolean);
}

function locationScore(locations: string[], place: string): {
  score: number;
  label: string;
} {
  if (!place.trim()) {
    return { score: 0, label: "" };
  }
  const tokens = placeTokens(place);
  const locs = locations.map(normalize);
  const cityMatch = locs.some((l) =>
    tokens.some((t) => phraseOverlaps(l, t))
  );
  const remote = locs.some(
    (l) => l.includes("remote") || l.includes("global")
  );

  if (cityMatch) {
    const display =
      place.split(",")[0]?.trim() || place.trim();
    return { score: 100, label: `Near ${display}` };
  }
  if (remote) {
    return { score: 40, label: "Remote-friendly" };
  }
  // soft regional overlap (US/UK/EU)
  const regional = locs.some((l) =>
    tokens.some((t) => {
      if (t.includes("united states") || t === "us" || t.includes("america"))
        return l === "us" || l.includes("united states");
      if (t.includes("uk") || t.includes("london"))
        return l === "uk" || l.includes("london");
      return false;
    })
  );
  if (regional) {
    return { score: 55, label: `Near ${place.split(",")[0]?.trim() || place}` };
  }
  return { score: 5, label: locations[0] ? locations[0] : "" };
}

function intentScore(company: CompanyDTO, intent: string): number {
  const q = normalize(intent);
  if (!q) return 0;
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  const hay = normalize(
    `${company.name} ${company.oneLiner ?? ""} ${company.notes ?? ""}`
  );
  let score = 0;
  for (const w of words) {
    if (hay.includes(w)) score += 25;
  }
  // bonus for full phrase
  if (hay.includes(q)) score += 20;
  return score;
}

export function rankNearby(
  companies: CompanyDTO[],
  place: string,
  intent?: string | null,
  limit = 12
): Omit<NearbyResult, "events" | "eventsSummary"> {
  const placeClean = place.trim();
  const intentClean = (intent ?? "").trim() || null;

  const scored: NearbyRecommendation[] = companies
    .map((c) => {
      const loc = locationScore(c.locations, placeClean);
      const intentPts = intentScore(c, intentClean ?? "");
      // Prefer local matches; intent boosts within that
      const score = loc.score + intentPts;
      return toRecommendation(c, score, loc.label);
    })
    .filter((c) => c.score >= 40 || (intentClean && c.score >= 25))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);

  // If filters were too strict, fall back to top remote-friendly / any
  let recommendations = scored;
  if (recommendations.length === 0) {
    recommendations = companies
      .map((c) => {
        const loc = locationScore(c.locations, placeClean || "Remote");
        return toRecommendation(
          c,
          loc.score + intentScore(c, intentClean ?? ""),
          loc.label || "Worth a look"
        );
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  const where = placeClean || "you";
  let summary: string;
  if (intentClean && placeClean) {
    summary = `Here are roles that fit “${intentClean}” near ${where}.`;
  } else if (placeClean) {
    summary = `Here are startups hiring near ${where}.`;
  } else if (intentClean) {
    summary = `Here are places that look like a match for “${intentClean}”.`;
  } else {
    summary = "Here are a few companies worth a look.";
  }

  return {
    summary,
    place: placeClean,
    intent: intentClean,
    recommendations,
  };
}
