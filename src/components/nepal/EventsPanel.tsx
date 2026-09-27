"use client";

import { useEffect, useMemo, useSyncExternalStore, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { Calendar, MapPin, Tag } from "lucide-react";
import { DistanceText } from "@/components/DistanceText";
import { DetailSheet } from "@/components/motion/DetailSheet";
import { SwipeRow } from "@/components/motion/SwipeRow";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { eventHref } from "@/lib/item-link";
import { eventInterestMatch, preferMatches } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";
import { eventTypeLabel, formatWhen, nptDateBucket } from "@/lib/nepal/format";
import {
  EVENT_TYPE_FILTERS,
  eventsNear,
  nepalEvents,
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

function DateTile({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <span className="date-tile">
        <strong>—</strong>
      </span>
    );
  }
  const date = new Date(iso);
  const month = new Intl.DateTimeFormat("en", { timeZone: "Asia/Kathmandu", month: "short" }).format(date);
  const day = new Intl.DateTimeFormat("en", { timeZone: "Asia/Kathmandu", day: "numeric" }).format(date);
  return (
    <time className="date-tile" dateTime={iso}>
      <span>{month}</span>
      <strong>{day}</strong>
    </time>
  );
}

function EventRow({ row }: { row: NearbyNepalEvent }) {
  const { event } = row;
  const href = eventHref(event.id);
  const saved = {
    id: event.id,
    kind: "event" as const,
    title: event.title,
    subtitle: event.city ?? "",
    href,
  };
  return (
    <SwipeRow item={saved} share={{ title: event.title, text: event.title, url: href }}>
    <article className="app-card event-card">
      <DateTile iso={event.start_date} />
      <div>
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
      <div className="card-footer">
        {event.url ? (
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn-secondary card-action">
            {row.timing === "upcoming" ? "Register" : "Open"}
          </a>
        ) : null}
        <SaveButton item={saved} />
        <ShareButton title={event.title} text={event.city ?? ""} url={href} />
      </div>
      </div>
    </article>
    </SwipeRow>
  );
}

export function EventsPanel({ origin }: { origin: PlaceHit }) {
  const nowMs = useSyncExternalStore(subscribeClock, readClientNow, () => 0);
  const searchParams = useSearchParams();
  const weekOnly = searchParams.get("when") === "week";
  const focusId = searchParams.get("id");
  const [focusClosed, setFocusClosed] = useState(false);
  useEffect(() => {
    setFocusClosed(false);
  }, [focusId]);
  const focused = focusId && !focusClosed ? nepalEvents.find((event) => event.id === focusId) ?? null : null;
  const [type, setType] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const profile = useProfile();
  const grouped = useMemo(() => {
    const now = nowMs === 0 ? null : new Date(nowMs);
    const base = eventsNear(origin, { type, freeOnly }, now);
    const rank = <T extends { event: { topics: string[] } }>(rows: T[]) =>
      preferMatches(rows, profile.eventInterests, (row) => eventInterestMatch(row.event.topics, profile.eventInterests));
    const upcoming = rank(base.upcoming);
    const clock = now ?? new Date();
    const today = upcoming.filter((row) => nptDateBucket(row.event.start_date, clock) === "today");
    const week = upcoming.filter((row) => nptDateBucket(row.event.start_date, clock) === "week");
    const later = upcoming.filter((row) => nptDateBucket(row.event.start_date, clock) === "later");
    return {
      ...base,
      today: weekOnly ? [] : today,
      week,
      later: weekOnly ? [] : later,
      recurring: rank(base.recurring),
      past: rank(base.past),
      online: rank(base.online),
    };
  }, [origin, type, freeOnly, nowMs, profile.eventInterests, weekOnly]);

  return (
    <div className="space-y-6 text-left">
      <p className="text-sm text-[var(--ink-muted)]">
        Near {origin.label}
        {profile.eventInterests.length > 0 ? ". Matching interests are listed first." : ""}
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

      {grouped.today.length + grouped.week.length + grouped.later.length === 0 ? (
        <EmptyState
          title="Nothing dated coming up"
          body={`No upcoming events matched near ${origin.label}.`}
        />
      ) : (
        <>
          {(
            [
              ["Today", grouped.today],
              ["This week", grouped.week],
              ["Later", grouped.later],
            ] as const
          ).map(([label, rows]) =>
            rows.length === 0 ? null : (
              <section key={label}>
                <h3 className="date-heading">{label}</h3>
                <div className="card-list">
                  {rows.map((row) => (
                    <EventRow key={row.event.id} row={row} />
                  ))}
                </div>
              </section>
            ),
          )}
        </>
      )}

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
      {focused ? (
        <DetailSheet title={focused.title} onClose={() => setFocusClosed(true)}>
          <h2>{focused.title}</h2>
          <p className="card-sub">{[focused.organizer, focused.city].filter(Boolean).join(" · ")}</p>
          <div className="card-footer">
            {focused.url ? (
              <a className="btn-secondary card-action" href={focused.url} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            ) : null}
            <SaveButton
              item={{
                id: focused.id,
                kind: "event",
                title: focused.title,
                subtitle: focused.city ?? "",
                href: eventHref(focused.id),
              }}
            />
            <ShareButton title={focused.title} url={eventHref(focused.id)} />
          </div>
        </DetailSheet>
      ) : null}
    </div>
  );
}
