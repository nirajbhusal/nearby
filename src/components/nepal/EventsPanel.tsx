"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useState } from "react";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { Calendar, CalendarOff, MapPin, Tag } from "lucide-react";
import { DistanceText } from "@/components/DistanceText";
import { SaveButton } from "@/components/SaveButton";
import { eventInterestMatch, preferMatches } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";
import { eventTypeLabel, formatWhen } from "@/lib/nepal/format";
import {
  EVENT_TYPE_FILTERS,
  eventsNear,
  type NearbyNepalEvent,
} from "@/lib/nepal/events";
import type { PlaceHit } from "@/lib/nepal/types";

let clientNow: number | null = null;

function subscribeClock() {
  return () => {};
}

function readClientNow() {
  clientNow ??= Date.now();
  return clientNow;
}

function EventRow({ row }: { row: NearbyNepalEvent }) {
  const { event } = row;
  return (
    <article className="app-card">
      <div className="card-tools">
        <SaveButton
          item={{
            id: event.id,
            kind: "event",
            title: event.title,
            subtitle: event.city ?? "",
            href: event.url || "/events",
          }}
        />
      </div>
      <h3>{event.title}</h3>
      <p className="card-sub">
        {[event.organizer, event.venue || event.city].filter(Boolean).join(" · ") || event.city}
      </p>
      <div className="meta-row">
        <span className="meta-chip">
          <Calendar aria-hidden />
          {event.start_date ? (
            <time dateTime={event.start_date}>{formatWhen(event.start_date, event.end_date)}</time>
          ) : (
            "Date not set"
          )}
        </span>
        {row.distanceKm != null ? (
          <span className="meta-chip">
            <MapPin aria-hidden />
            <DistanceText km={row.distanceKm} />
          </span>
        ) : null}
        <span className="meta-chip">
          <Tag aria-hidden />
          {eventTypeLabel(event.type)}
        </span>
        {event.free === true ? <span className="meta-chip">Free</span> : null}
        {event.free === false ? <span className="meta-chip">Paid</span> : null}
      </div>
      {event.recurring && row.timing === "recurring" ? <p className="card-sub">{event.recurring}</p> : null}
      {event.url ? (
        <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn-secondary card-action">
          {row.timing === "upcoming" ? "Register" : "Open"}
        </a>
      ) : null}
    </article>
  );
}

export function EventsPanel({ origin }: { origin: PlaceHit }) {
  const nowMs = useSyncExternalStore(subscribeClock, readClientNow, () => 0);
  const [type, setType] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const profile = useProfile();
  const grouped = useMemo(() => {
    const base = eventsNear(origin, { type, freeOnly }, nowMs === 0 ? null : new Date(nowMs));
    const rank = <T extends { event: { topics: string[] } }>(rows: T[]) =>
      preferMatches(rows, profile.eventInterests, (row) => eventInterestMatch(row.event.topics, profile.eventInterests));
    return {
      ...base,
      upcoming: rank(base.upcoming),
      recurring: rank(base.recurring),
      past: rank(base.past),
      online: rank(base.online),
    };
  }, [origin, type, freeOnly, nowMs, profile.eventInterests]);

  return (
    <div className="space-y-6 text-left">
      <p className="text-sm text-[var(--ink-muted)]">
        Near {origin.label}, using today&apos;s date in NPT. A missing price stays blank.
        {profile.eventInterests.length > 0 ? " Matching interests are listed first." : ""}
      </p>
      <div className="space-y-3">
        <ChipRow label="Type">
          <Chip pressed={!type} onClick={() => setType(null)}>
            Any
          </Chip>
          {EVENT_TYPE_FILTERS.map((item) => (
            <Chip key={item} pressed={type === item} onClick={() => setType(item)}>
              {eventTypeLabel(item)}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Cost">
          <Chip pressed={freeOnly} onClick={() => setFreeOnly((value) => !value)}>
            Free
          </Chip>
        </ChipRow>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-[var(--ink-muted)]">
          Upcoming
        </h3>
        {grouped.upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Nothing dated coming up"
            body={`No upcoming events matched near ${origin.label}.`}
          />
        ) : (
          <div className="card-list">
            {grouped.upcoming.map((row) => (
              <EventRow key={row.event.id} row={row} />
            ))}
          </div>
        )}
      </section>

      {grouped.online.some((row) => row.timing === "upcoming") ? (
        <section>
          <h3 className="font-display text-base italic text-[var(--ink-muted)]">
            Online
          </h3>
          <div className="card-list">
            {grouped.online
              .filter((row) => row.timing === "upcoming")
              .map((row) => (
                <EventRow key={row.event.id} row={row} />
              ))}
          </div>
        </section>
      ) : null}

      {grouped.recurring.length > 0 ? (
        <section>
          <h3 className="font-display text-base italic text-[var(--ink-muted)]">
            Happens regularly
          </h3>
          <p className="mb-2 text-sm text-[var(--ink-faint)]">
            Series with no confirmed next date.
          </p>
          <div className="card-list">
            {grouped.recurring.map((row) => (
              <EventRow key={row.event.id} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      {grouped.past.length > 0 ? (
        <details>
          <summary className="cursor-pointer py-2 text-sm text-[var(--ink-muted)]">
            Recent ({grouped.past.length})
          </summary>
          <div className="card-list">
            {grouped.past.map((row) => (
              <EventRow key={row.event.id} row={row} />
            ))}
          </div>
        </details>
      ) : null}

      <CuratedNote />
    </div>
  );
}
