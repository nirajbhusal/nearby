import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toCompanyDTO } from "@/lib/companies";
import { SketchPin } from "@/components/illustrations/SketchPin";
import { JobIcon } from "@/components/illustrations/JobIcon";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function CompanyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const row = await prisma.company.findUnique({ where: { slug } });
  if (!row) notFound();

  const company = toCompanyDTO(row);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 sm:px-6 sm:py-20">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-[var(--ink-faint)] transition hover:text-[var(--graphite)]"
      >
        <SketchPin className="h-3.5 w-3.5 text-[var(--accent)]" />
        ← Nearby
      </Link>

      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--graphite)] sm:text-4xl">
            {company.name}
          </h1>
          {company.oneLiner ? (
            <p className="text-lg leading-relaxed text-[var(--ink-muted)]">
              {company.oneLiner}
            </p>
          ) : null}
        </div>

        {company.locations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {company.locations.map((loc) => (
              <span
                key={loc}
                className="rounded-full border border-[var(--line-soft)] bg-[color-mix(in_srgb,white_45%,var(--paper))] px-3 py-1 text-sm text-[var(--ink-muted)]"
              >
                {loc}
              </span>
            ))}
          </div>
        ) : null}

        {company.notes ? (
          <p className="text-[15px] leading-relaxed text-[var(--ink-muted)]">
            {company.notes}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {company.careersUrl ? (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--graphite)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:bg-[var(--accent)]"
            >
              <JobIcon className="h-3.5 w-3.5" stroke="currentColor" />
              Open roles →
            </a>
          ) : null}
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,white_50%,var(--paper))] px-5 py-2.5 text-sm text-[var(--graphite)] transition hover:border-[var(--accent-soft)]"
            >
              Website
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
