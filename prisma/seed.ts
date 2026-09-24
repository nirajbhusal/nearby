import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadJsonArray(path: string): SeedCompany[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array at ${path}`);
  }
  return parsed as SeedCompany[];
}

/** Merge waves by normalized slug; first-seen wins (wave1 over wave2). */
function mergeCompanies(waves: SeedCompany[][]): {
  merged: SeedCompany[];
  skipped: string[];
} {
  const bySlug = new Map<string, SeedCompany>();
  const skipped: string[] = [];
  for (const wave of waves) {
    for (const c of wave) {
      const slug = slugify(c.name);
      if (bySlug.has(slug)) {
        skipped.push(c.name);
        continue;
      }
      bySlug.set(slug, c);
    }
  }
  return { merged: Array.from(bySlug.values()), skipped };
}

async function seedCompanies() {
  const portal = "/workspace/startup-hiring-portal";
  const wave1Path = join(portal, "seed-companies.json");
  const wave2Path = join(portal, "seed-companies-wave2.json");
  const local = join(__dirname, "seed-data.json");

  const wave1 = loadJsonArray(wave1Path);
  const wave2 = loadJsonArray(wave2Path);

  if (wave1.length === 0 && wave2.length === 0) {
    if (!existsSync(local)) {
      throw new Error(
        "No seed data found. Add wave1/wave2 under /workspace/startup-hiring-portal or prisma/seed-data.json"
      );
    }
    const companies: SeedCompany[] = JSON.parse(readFileSync(local, "utf8"));
    console.log(`Seeding ${companies.length} companies from local seed-data.json...`);
    await writeCompanies(companies);
    return;
  }

  const { merged, skipped } = mergeCompanies([wave1, wave2]);
  writeFileSync(local, JSON.stringify(merged, null, 2) + "\n");
  console.log(
    `Merged wave1 (${wave1.length}) + wave2 (${wave2.length}) -> ${merged.length} unique (skipped ${skipped.length} duplicates: ${skipped.join(", ") || "none"})`
  );
  console.log(`Wrote ${local}`);

  await writeCompanies(merged);
}

async function writeCompanies(companies: SeedCompany[]) {
  console.log(`Seeding ${companies.length} companies...`);
  await prisma.company.deleteMany();

  for (const c of companies) {
    const slug = slugify(c.name);
    await prisma.company.create({
      data: {
        name: c.name,
        slug,
        oneLiner: c.one_liner ?? null,
        website: c.website ?? null,
        careersUrl: c.careers_url ?? null,
        locations: JSON.stringify(c.locations ?? []),
        source: c.source ?? "curated",
        sourceUrl: c.source_url ?? null,
        notes: c.notes ?? null,
        listedAt: c.listed_at ? new Date(c.listed_at) : new Date(),
      },
    });
  }

  console.log(`Seeded ${companies.length} companies.`);
}

async function seedEvents() {
  const local = join(__dirname, "seed-events.json");
  if (!existsSync(local)) {
    console.log("No prisma/seed-events.json — skipping events.");
    return;
  }

  const events: SeedEvent[] = JSON.parse(readFileSync(local, "utf8"));
  console.log(`Upserting ${events.length} events...`);

  let upserted = 0;
  for (const e of events) {
    const startsAt = new Date(e.startsAt);
    const existing = await prisma.event.findFirst({
      where: {
        city: e.city,
        startsAt,
        category: e.category ?? "ai_meetup",
      },
    });

    const data = {
      title: e.title,
      city: e.city,
      country: e.country ?? null,
      startsAt,
      endAt: e.endAt ? new Date(e.endAt) : null,
      url: e.url ?? null,
      category: e.category ?? "ai_meetup",
      description: e.description ?? null,
      source: e.source ?? "curated",
    };

    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data });
    } else {
      await prisma.event.create({ data });
    }
    upserted += 1;
  }

  console.log(`Upserted ${upserted} events.`);
}

async function main() {
  await seedCompanies();
  await seedEvents();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
