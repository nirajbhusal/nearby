export type CompanyDTO = {
  id: string;
  name: string;
  slug: string;
  oneLiner: string | null;
  website: string | null;
  careersUrl: string | null;
  locations: string[];
  source: string;
  sourceUrl: string | null;
  notes: string | null;
  listedAt: string;
};

export function parseLocations(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw ? [raw] : [];
  }
}

export function toCompanyDTO(c: {
  id: string;
  name: string;
  slug: string;
  oneLiner: string | null;
  website: string | null;
  careersUrl: string | null;
  locations: string;
  source: string;
  sourceUrl: string | null;
  notes: string | null;
  listedAt: Date;
}): CompanyDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    oneLiner: c.oneLiner,
    website: c.website,
    careersUrl: c.careersUrl,
    locations: parseLocations(c.locations),
    source: c.source,
    sourceUrl: c.sourceUrl,
    notes: c.notes,
    listedAt: c.listedAt.toISOString(),
  };
}
