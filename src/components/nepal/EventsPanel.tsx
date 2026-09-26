"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useState } from "react";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { CalendarOff } from "lucide-react";
import { eventTypeLabel, formatKm, formatWhen } from "@/lib/nepal/format";
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
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {event.start_date ? (
          <time
            dateTime={event.start_date}
            className="text-sm tabular-nums text-[var(--accent)]"
          >
            {formatWhen(event.start_date, event.end_date)}
          </time>
        ) : (
          <span className="text-sm text-[var(--accent)]">Date not set</span>
        )}
        <span className="text-sm text-[var(--ink-muted)]">
          {event.city}
          {row.distanceKm != null ? ` · ${formatKm(row.distanceKm)}` : ""}
        </span>
        {event.free === true ? (
          <span className="text-xs tracking-wide text-[var(--ink-faint)]">Free</span>
        ) : null}
        {event.free === false ? (
          <span className="text-xs tracking-wide text-[var(--ink-faint)]">Paid</span>
        ) : null}
      </div>
      <h3 className="mt-1 text-[15px] font-medium text-[var(--graphite)]">
        {event.title}
      </h3>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {[eventTypeLabel(event.type), event.organizer, event.venue]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {event.recurring && row.timing === "recurring" ? (
        <p className="mt-1 text-sm text-[var(--ink-faint)]">{event.recurring}</p>
      ) : null}
      {event.url ? (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-3"
        >
          {row.timing === "upcoming" ? "Register / details" : "Details"} →
        </a>
      ) : null}
    </article>
  );
}

export function EventsPanel({ origin }: { origin: PlaceHit }) {
  const nowMs = useSyncExternalStore(subscribeClock, readClientNow, () => 0);
  const [type, setType] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const grouped = useMemo(
    () =>
      eventsNear(
        origin,
        { type, freeOnly },
        nowMs === 0 ? null : new Date(nowMs)
      ),
    [origin, type, freeOnly, nowMs]
  );

  return (
    <div className="space-y-6 text-left">
      <p className="text-sm text-[var(--ink-muted)]">
        Near {origin.label}, using today&apos;s date in Nepal time. A missing price stays blank.
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
