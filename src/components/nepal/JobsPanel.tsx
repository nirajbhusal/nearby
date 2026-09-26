"use client";

import { useMemo, useState } from "react";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptySketch } from "@/components/illustrations/EmptySketch";
import { categoryLabel, formatKm } from "@/lib/nepal/format";
import {
  companiesNear,
  jobCategories,
  jobCities,
  type NearbyCompany,
} from "@/lib/nepal/jobs";
import type { PlaceHit } from "@/lib/nepal/types";

function CompanyCard({ row }: { row: NearbyCompany }) {
  const { company } = row;
  const [open, setOpen] = useState(false);
  const roles = open ? company.open_roles : company.open_roles.slice(0, 4);
  return (
    <article className="app-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium tracking-tight text-[var(--graphite)]">
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)]"
            >
              {company.name}
            </a>
          ) : (
            company.name
          )}
        </h3>
        {row.distanceKm != null ? (
          <p className="text-sm text-[var(--accent)]">{formatKm(row.distanceKm)}</p>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {row.placeLabel}
        {company.category ? ` · ${categoryLabel(company.category)}` : ""}
        {company.remote_friendly === true ? " · Remote-friendly" : ""}
        {company.remote_friendly === false ? " · On-site" : ""}
      </p>
      {company.description ? (
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
          {company.description}
        </p>
      ) : null}
      {company.open_roles.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {roles.map((role) => (
            <li key={`${role.title}-${role.url}`} className="text-sm">
              <a
                href={role.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ink-link"
              >
                {role.title}
              </a>
              {role.location ? (
                <span className="text-[var(--ink-faint)]"> · {role.location}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--ink-faint)]">No open roles listed.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-4">
        {company.open_roles.length > 4 ? (
          <button
            type="button"
            className="text-sm text-[var(--ink-muted)] underline-offset-4 hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Show fewer roles" : `Show all ${company.open_roles.length} roles`}
          </button>
        ) : null}
        {company.careers_url ? (
          <a
            href={company.careers_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Careers →
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function JobsPanel({ origin }: { origin: PlaceHit }) {
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const categories = useMemo(() => jobCategories(), []);
  const cities = useMemo(() => jobCities(origin), [origin]);
  const { near, unlocated } = useMemo(
    () => companiesNear(origin, { category, city, remoteOnly }),
    [origin, category, city, remoteOnly]
  );

  return (
    <div className="space-y-6 text-left">
      <p className="text-sm text-[var(--ink-muted)]">
        Near {origin.label}. Office locations are city centroids.
      </p>
      <div className="space-y-3">
        <ChipRow label="Category">
          <Chip pressed={!category} onClick={() => setCategory(null)}>
            Any
          </Chip>
          {categories.map((item) => (
            <Chip
              key={item}
              pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {categoryLabel(item)}
            </Chip>
          ))}
        </ChipRow>
        {cities.length > 1 ? (
          <ChipRow label="City">
            <Chip pressed={!city} onClick={() => setCity(null)}>
              Any nearby
            </Chip>
            {cities.map((item) => (
              <Chip key={item} pressed={city === item} onClick={() => setCity(item)}>
                {item}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
        <ChipRow label="Work style">
          <Chip pressed={remoteOnly} onClick={() => setRemoteOnly((value) => !value)}>
            Remote-friendly
          </Chip>
        </ChipRow>
      </div>
      <p className="text-sm text-[var(--ink-muted)]" aria-live="polite">
        {near.length === 0
          ? `No companies matched near ${origin.label}.`
          : `${near.length} compan${near.length === 1 ? "y" : "ies"} ${
              remoteOnly ? "that list remote-friendly work" : `near ${origin.label}`
            }.`}
      </p>
      {near.length === 0 ? (
        <div className="space-y-3 py-6 text-center">
          <EmptySketch className="mx-auto h-16 w-24 text-[var(--ink-faint)]" />
        </div>
      ) : (
        <div className="card-list">
          {near.map((row) => (
            <CompanyCard key={row.company.slug} row={row} />
          ))}
        </div>
      )}
      {!city && !remoteOnly && unlocated.length > 0 ? (
        <details className="text-sm text-[var(--ink-muted)]">
          <summary className="cursor-pointer py-2">
            Office city not listed ({unlocated.length})
          </summary>
          <div className="card-list">
            {unlocated.map((row) => (
              <CompanyCard key={row.company.slug} row={row} />
            ))}
          </div>
        </details>
      ) : null}
      <CuratedNote />
    </div>
  );
}
