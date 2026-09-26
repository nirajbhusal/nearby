"use client";

import { useCallback, useSyncExternalStore, useState } from "react";
import { loadCompanies, loadEvents } from "@/lib/catalog";
import { rankNearby, type NearbyResult } from "@/lib/nearby";
import {
  rankNearbyEvents,
  upcomingEvents,
  type EventDTO,
  type NearbyEvent,
} from "@/lib/events";
import { RecommendationRow } from "@/components/RecommendationRow";
import { SketchPin } from "@/components/illustrations/SketchPin";
import { CityHorizon } from "@/components/illustrations/CityHorizon";
import { MeetupIcon } from "@/components/illustrations/MeetupIcon";
import { JobIcon } from "@/components/illustrations/JobIcon";
import { EmptySketch } from "@/components/illustrations/EmptySketch";
import Link from "next/link";
import { reverseGeocode } from "@/lib/reverse-geocode";

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function placeLabel(place: string | null | undefined): string {
  if (!place) return "somewhere nearby";
  const trimmed = place.trim();
  if (!trimmed) return "somewhere nearby";
  // Prefer the city portion before a comma
  const city = trimmed.split(",")[0]?.trim();
  return city || trimmed;
}

const EMPTY_UPCOMING: EventDTO[] = [];
let upcomingSnapshot: EventDTO[] | null = null;

function subscribeUpcoming() {
  return () => {};
}

function getUpcomingSnapshot(): EventDTO[] {
  upcomingSnapshot ??= upcomingEvents(loadEvents(), 5);
  return upcomingSnapshot;
}

function EventRow({ event }: { event: NearbyEvent | EventDTO }) {
  const label = "nearnessLabel" in event ? event.nearnessLabel : undefined;
  return (
    <article className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--line-soft)] py-4 last:border-b-0">
      <time
        dateTime={event.startsAt}
        className="ink-link shrink-0 text-sm tabular-nums"
      >
        {formatEventDate(event.startsAt)}
      </time>
      <span className="shrink-0 text-sm text-[var(--ink-muted)]">
        {event.city}
      </span>
      <span className="min-w-0 flex-1 text-[15px] text-[var(--graphite)]">
        {event.title}
      </span>
      {label ? (
        <span className="text-xs text-[var(--ink-faint)]">{label}</span>
      ) : null}
      {event.url ? (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ink-link shrink-0 text-sm"
        >
          RSVP →
        </a>
      ) : null}
    </article>
  );
}

export function NearbyFinder() {
  const [place, setPlace] = useState("");
  const [intent, setIntent] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NearbyResult | null>(null);
  const upcoming = useSyncExternalStore(
    subscribeUpcoming,
    getUpcomingSnapshot,
    () => EMPTY_UPCOMING
  );

  const findNearby = useCallback(
    (placeOverride?: string) => {
      const p = (placeOverride ?? place).trim();
      const i = intent.trim();
      if (!p && !i) {
        setError("Tell us a place, or a role you’re looking for.");
        return;
      }
      setError(null);
      const jobResult = rankNearby(loadCompanies(), p, i || undefined);
      const eventResult = rankNearbyEvents(loadEvents(), p);
      setResult({
        ...jobResult,
        events: eventResult.events,
        eventsSummary: eventResult.eventsSummary,
      });
    },
    [place, intent]
  );

  const useMyLocation = useCallback(() => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Location isn’t available here — type a city instead.");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const label = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setGeoBusy(false);
        if (label) {
          setPlace(label);
          findNearby(label);
        } else {
          setGeoError(
            "Couldn’t name your city — type one below (e.g. San Francisco)."
          );
        }
      },
      () => {
        setGeoBusy(false);
        setGeoError("Location access was blocked — type a city instead.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [findNearby]);

  const lookingCity = placeLabel(
    result?.place || place || undefined
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
      <section className="space-y-10 text-center">
        <div className="space-y-5">
          <div className="flex justify-center text-[var(--accent)]">
            <SketchPin className="h-9 w-9" />
          </div>
          <p className="text-sm tracking-wide text-[var(--ink-faint)]">
            Worldwide · jobs and AI meetups
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--graphite)] sm:text-5xl">
            Where should we look?
          </h1>
          <p className="text-sm text-[var(--ink-faint)]">
            <Link href="/" className="ink-link">
              Back to Nepal
            </Link>
          </p>
        </div>

        <form
          className="mx-auto max-w-lg space-y-4 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            findNearby();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="place" className="sr-only">
              City or neighborhood
            </label>
            <input
              id="place"
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="City or neighborhood"
              autoComplete="address-level2"
              className="paper-field w-full px-5 py-4 text-lg text-[var(--graphite)] placeholder:text-[var(--ink-faint)] placeholder:italic"
            />
            <div className="flex flex-wrap items-center gap-3 px-1">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoBusy}
                className="text-sm text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--graphite)] hover:underline disabled:opacity-50"
              >
                {geoBusy ? "Finding you…" : "Use my location"}
              </button>
              {geoError ? (
                <span className="text-sm text-[var(--ink-faint)]">
                  {geoError}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="intent" className="sr-only">
              Role intent
            </label>
            <input
              id="intent"
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="What kind of role? (optional)"
              className="paper-field w-full px-5 py-3.5 text-base text-[var(--graphite)] placeholder:text-[var(--ink-faint)] placeholder:italic"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--graphite)] px-5 py-4 text-base font-medium text-[var(--paper)] transition hover:bg-[var(--accent)]"
          >
            Find nearby
          </button>
        </form>

        {error ? (
          <div className="mx-auto max-w-sm space-y-3 py-2">
            <EmptySketch
              className="mx-auto h-16 w-24 text-[var(--ink-faint)]"
            />
            <p className="text-sm text-[var(--ink-muted)]">{error}</p>
          </div>
        ) : null}
      </section>

      {!result && upcoming.length > 0 ? (
        <section className="mt-20 text-left">
          <div className="mb-4 flex items-center gap-2">
            <MeetupIcon className="h-4 w-4 text-[var(--accent)]" />
            <p className="font-display text-sm italic tracking-wide text-[var(--ink-muted)]">
              Upcoming AI meetups
            </p>
          </div>
          <hr className="sketch-rule mb-1" />
          <div>
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {result ? (
        <>
          {/* Illustrated place card */}
          <div className="sketch-card mt-16 overflow-hidden px-5 pb-4 pt-5 sm:px-6">
            <div className="mb-1 flex items-center gap-2">
              <SketchPin className="h-4 w-4 text-[var(--accent)]" />
              <p className="font-display text-lg font-medium tracking-tight text-[var(--graphite)]">
                Looking around {lookingCity}
              </p>
            </div>
            <div className="text-[var(--ink-faint)]">
              <CityHorizon
                className="h-14 w-full"
                stroke="currentColor"
                label={lookingCity}
              />
            </div>
          </div>

          <section className="mt-10 space-y-2 text-left">
            <p className="mb-6 text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {result.summary}
            </p>
            {result.recommendations.length === 0 ? (
              <div className="space-y-3 py-10 text-center">
                <EmptySketch className="mx-auto h-20 w-28 text-[var(--ink-faint)]" />
                <p className="text-[var(--ink-muted)]">
                  Nothing close matched. Try another city or drop the role
                  filter.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <JobIcon className="h-4 w-4 text-[var(--accent)]" />
                  <p className="font-display text-sm italic tracking-wide text-[var(--ink-muted)]">
                    Companies hiring nearby
                  </p>
                </div>
                <hr className="sketch-rule mb-1" />
                {result.recommendations.map((c) => (
                  <RecommendationRow key={c.id} company={c} />
                ))}
              </div>
            )}
          </section>

          {result.events && result.events.length > 0 ? (
            <section className="mt-14 space-y-2 text-left">
              <div className="mb-2 flex items-center gap-2">
                <MeetupIcon className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-medium tracking-tight text-[var(--graphite)]">
                  AI meetups near you
                </h2>
              </div>
              <p className="mb-4 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                {result.eventsSummary}
              </p>
              <hr className="sketch-rule mb-1" />
              <div>
                {result.events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
