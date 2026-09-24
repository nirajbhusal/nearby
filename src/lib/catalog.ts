import type { CompanyDTO } from "@/lib/companies";
import type { EventDTO } from "@/lib/events";
import seedCompanies from "../../prisma/seed-data.json";
import seedEvents from "../../prisma/seed-events.json";

type SeedCompany = {
  name: string;
  one_liner?: string | null;
  locations?: string[];
  careers_url?: string | null;
  website?: string | null;
  notes?: string | null;
  source?: string | null;
  source_url?: string | null;
  listed_at?: string | null;
};

type SeedEvent = {
  title: string;
  city: string;
  country?: string | null;
  startsAt: string;
  endAt?: string | null;
  url?: string | null;
  category?: string | null;
  description?: string | null;
  source?: string | null;
};

const FALLBACK_LISTED_AT = "2026-01-01T00:00:00.000Z";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toCompany(c: SeedCompany): CompanyDTO {
  const listed = c.listed_at ? new Date(c.listed_at) : null;
  return {
    id: slugify(c.name),
    name: c.name,
    slug: slugify(c.name),
    oneLiner: c.one_liner ?? null,
    website: c.website ?? null,
    careersUrl: c.careers_url ?? null,
    locations: Array.isArray(c.locations) ? c.locations.map(String) : [],
    source: c.source?.trim() || "curated",
    sourceUrl: c.source_url ?? null,
    notes: c.notes ?? null,
    listedAt:
      listed && !Number.isNaN(listed.getTime())
        ? listed.toISOString()
        : FALLBACK_LISTED_AT,
  };
}

/** First-seen slug wins, matching prisma/seed.ts. */
export function loadCompanies(): CompanyDTO[] {
  const bySlug = new Map<string, CompanyDTO>();
  for (const row of seedCompanies as SeedCompany[]) {
    if (!row?.name) continue;
    const company = toCompany(row);
    if (!company.slug || bySlug.has(company.slug)) continue;
    bySlug.set(company.slug, company);
  }
  return Array.from(bySlug.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getCompanyBySlug(slug: string): CompanyDTO | undefined {
  return loadCompanies().find((c) => c.slug === slug);
}

export function loadEvents(): EventDTO[] {
  return (seedEvents as SeedEvent[]).map((e, index) => ({
    id: `${slugify(e.city) || "event"}-${e.startsAt}-${index}`,
    title: e.title,
    city: e.city,
    country: e.country ?? null,
    startsAt: e.startsAt,
    endAt: e.endAt ?? null,
    url: e.url ?? null,
    category: e.category ?? "ai_meetup",
    description: e.description ?? null,
    source: e.source?.trim() || "curated",
  }));
}
