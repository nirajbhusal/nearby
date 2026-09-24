import Link from "next/link";
import type { NearbyRecommendation } from "@/lib/nearby";
import { JobIcon } from "@/components/illustrations/JobIcon";

export function RecommendationRow({
  company,
}: {
  company: NearbyRecommendation;
}) {
  return (
    <article className="group border-b border-[var(--line-soft)] py-7 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <JobIcon className="h-3.5 w-3.5 shrink-0 text-[var(--ink-faint)]" />
              <Link
                href={`/company/${company.slug}`}
                className="text-lg font-medium tracking-tight text-[var(--graphite)] transition group-hover:text-[var(--accent)]"
              >
                {company.name}
              </Link>
            </span>
            {company.nearnessLabel ? (
              <span className="text-sm text-[var(--ink-faint)]">
                {company.nearnessLabel}
              </span>
            ) : null}
          </div>
          {company.oneLiner ? (
            <p className="max-w-xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {company.oneLiner}
            </p>
          ) : null}
          {company.locations.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {company.locations.slice(0, 4).map((loc) => (
                <span
                  key={loc}
                  className="rounded-full border border-[var(--line-soft)] bg-[color-mix(in_srgb,white_45%,var(--paper))] px-2.5 py-0.5 text-xs text-[var(--ink-muted)]"
                >
                  {loc}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {company.careersUrl ? (
          <a
            href={company.careersUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ink-link shrink-0 self-start text-sm"
          >
            Open roles →
          </a>
        ) : (
          <Link
            href={`/company/${company.slug}`}
            className="ink-link shrink-0 self-start text-sm"
          >
            Details →
          </Link>
        )}
      </div>
    </article>
  );
}
