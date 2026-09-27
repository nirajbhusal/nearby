"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { GraduationCap, MapPin } from "lucide-react";
import { DistanceText } from "@/components/DistanceText";
import { DetailSheet } from "@/components/motion/DetailSheet";
import { SwipeRow } from "@/components/motion/SwipeRow";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { learnHref } from "@/lib/item-link";
import { learnTypeLabel, modeLabel } from "@/lib/nepal/format";
import { learnNear, learnPlaces, learnTypes, type NearbyLearn } from "@/lib/nepal/learn";
import type { PlaceHit } from "@/lib/nepal/types";

const MODES = [
  { id: "in_person", label: "In person" },
  { id: "online", label: "Online" },
  { id: "hybrid", label: "Hybrid" },
] as const;

function PlaceCard({ row }: { row: NearbyLearn }) {
  const { place } = row;
  const href = learnHref(place.slug);
  const saved = {
    id: place.slug,
    kind: "learn" as const,
    title: place.name,
    subtitle: place.city ?? "",
    href,
  };
  return (
    <SwipeRow item={saved} share={{ title: place.name, text: place.name, url: href }}>
    <article className="app-card">
      <h3>
        {place.website ? (
          <a href={place.website} target="_blank" rel="noopener noreferrer">
            {place.name}
          </a>
        ) : (
          place.name
        )}
      </h3>
      <p className="card-sub">{[place.city, learnTypeLabel(place.type)].filter(Boolean).join(" · ")}</p>
      <div className="meta-row">
        {row.distanceKm != null ? (
          <span className="meta-chip">
            <MapPin aria-hidden />
            <DistanceText km={row.distanceKm} />
          </span>
        ) : null}
        {place.mode ? <span className="meta-chip">{modeLabel(place.mode)}</span> : null}
      </div>
      {place.programs.length > 0 ? (
        <ul className="program-list">
          {place.programs.map((program) => (
            <li key={program.url + program.title}>
              <a href={program.url} target="_blank" rel="noopener noreferrer" className="ink-link">
                {program.title}
              </a>
              {program.level ? <span> · {program.level}</span> : null}
              {program.duration ? <span> · {program.duration}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="card-footer">
        {place.website ? (
          <a href={place.website} target="_blank" rel="noopener noreferrer" className="btn-secondary card-action">
            Open
          </a>
        ) : null}
        <SaveButton item={saved} />
        <ShareButton title={place.name} url={href} />
      </div>
    </article>
    </SwipeRow>
  );
}

export function LearnPanel({ origin }: { origin: PlaceHit }) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [focusClosed, setFocusClosed] = useState(false);
  useEffect(() => {
    setFocusClosed(false);
  }, [focusId]);
  const focused = focusId && !focusClosed ? learnPlaces.find((place) => place.slug === focusId) ?? null : null;
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
      {focused ? (
        <DetailSheet title={focused.name} onClose={() => setFocusClosed(true)}>
          <h2>{focused.name}</h2>
          <p className="card-sub">{[focused.city, learnTypeLabel(focused.type)].filter(Boolean).join(" · ")}</p>
          <div className="card-footer">
            {focused.website ? (
              <a className="btn-secondary card-action" href={focused.website} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            ) : null}
            <SaveButton
              item={{
                id: focused.slug,
                kind: "learn",
                title: focused.name,
                subtitle: focused.city ?? "",
                href: learnHref(focused.slug),
              }}
            />
            <ShareButton title={focused.name} url={learnHref(focused.slug)} />
          </div>
        </DetailSheet>
      ) : null}
    </div>
  );
}
