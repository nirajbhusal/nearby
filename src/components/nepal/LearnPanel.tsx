"use client";

import { useMemo, useState } from "react";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { GraduationCap } from "lucide-react";
import { DistanceText } from "@/components/DistanceText";
import { learnTypeLabel, modeLabel } from "@/lib/nepal/format";
import { learnNear, learnTypes, type NearbyLearn } from "@/lib/nepal/learn";
import type { PlaceHit } from "@/lib/nepal/types";

const MODES = [
  { id: "in_person", label: "In person" },
  { id: "online", label: "Online" },
  { id: "hybrid", label: "Hybrid" },
] as const;

function PlaceCard({ row }: { row: NearbyLearn }) {
  const { place } = row;
  return (
    <article className="app-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium tracking-tight text-[var(--graphite)]">
          {place.website ? (
            <a
              href={place.website}
              className="hover:text-[var(--accent)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              {place.name}
            </a>
          ) : (
            place.name
          )}
        </h3>
        {row.distanceKm != null ? (
          <p className="text-sm text-[var(--accent)]">
            <DistanceText km={row.distanceKm} />
          </p>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {[place.city, learnTypeLabel(place.type), modeLabel(place.mode)]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {place.address ? (
        <p className="mt-1 text-sm text-[var(--ink-faint)]">{place.address}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {place.programs.map((program) => (
          <li key={program.url + program.title} className="text-sm">
            <a
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ink-link"
            >
              {program.title}
            </a>
            {program.level ? (
              <span className="text-[var(--ink-faint)]"> · {program.level}</span>
            ) : null}
            {program.duration ? (
              <span className="text-[var(--ink-faint)]"> · {program.duration}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {place.website ? (
        <a
          href={place.website}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-3"
        >
          Website
        </a>
      ) : null}
    </article>
  );
}

export function LearnPanel({ origin }: { origin: PlaceHit }) {
  const [type, setType] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const types = useMemo(() => learnTypes(), []);
  const { near, online } = useMemo(
    () => learnNear(origin, { type, mode }),
    [origin, type, mode]
  );

  return (
    <div className="space-y-6 text-left">
      <p className="text-sm text-[var(--ink-muted)]">
        Near {origin.label}. Program links open the organizer&apos;s page.
      </p>
      <div className="space-y-3">
        <ChipRow label="Type">
          <Chip pressed={!type} onClick={() => setType(null)}>
            Any
          </Chip>
          {types.map((item) => (
            <Chip key={item} pressed={type === item} onClick={() => setType(item)}>
              {learnTypeLabel(item)}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Mode">
          <Chip pressed={!mode} onClick={() => setMode(null)}>
            Any
          </Chip>
          {MODES.map((item) => (
            <Chip
              key={item.id}
              pressed={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </Chip>
          ))}
        </ChipRow>
      </div>
      <p className="text-sm text-[var(--ink-muted)]" aria-live="polite">
        {near.length === 0
          ? `No in-person places matched near ${origin.label}.`
          : `${near.length} place${near.length === 1 ? "" : "s"} near ${origin.label}.`}
      </p>
      {near.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No places in this view"
          body={`No in-person programs matched near ${origin.label}. Online options stay listed below when they exist.`}
        />
      ) : (
        <div className="card-list">
          {near.map((row) => (
            <PlaceCard key={row.place.slug} row={row} />
          ))}
        </div>
      )}
      {online.length > 0 ? (
        <section className="space-y-2">
          <h3 className="font-display text-base italic text-[var(--ink-muted)]">
            Study online
          </h3>
          <div className="card-list">
            {online.map((row) => (
              <PlaceCard key={row.place.slug} row={row} />
            ))}
          </div>
        </section>
      ) : null}
      <CuratedNote />
    </div>
  );
}
