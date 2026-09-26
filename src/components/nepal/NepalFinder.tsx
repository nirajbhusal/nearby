"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EvPanel } from "@/components/nepal/EvPanel";

const JobsPanel = dynamic(() =>
  import("@/components/nepal/JobsPanel").then((mod) => mod.JobsPanel)
);
const LearnPanel = dynamic(() =>
  import("@/components/nepal/LearnPanel").then((mod) => mod.LearnPanel)
);
const EventsPanel = dynamic(() =>
  import("@/components/nepal/EventsPanel").then((mod) => mod.EventsPanel)
);
import { SketchPin } from "@/components/illustrations/SketchPin";
import { CityHorizon } from "@/components/illustrations/CityHorizon";
import { reverseGeocode } from "@/lib/reverse-geocode";
import { KATHMANDU, resolvePlace } from "@/lib/nepal/places";
import type { PlaceHit } from "@/lib/nepal/types";

const SECTIONS = [
  { id: "ev", label: "EV charging" },
  { id: "jobs", label: "Jobs" },
  { id: "learn", label: "Learn AI" },
  { id: "events", label: "Events" },
] as const;

type Section = (typeof SECTIONS)[number]["id"];

function readSection(value: string | null): Section {
  if (value === "jobs" || value === "learn" || value === "events" || value === "ev") {
    return value;
  }
  return "ev";
}

export function NepalFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = readSection(searchParams.get("section"));
  const queryParam = searchParams.get("q");

  const initial = useMemo(() => {
    if (!queryParam) return { origin: KATHMANDU, error: null as string | null };
    const hit = resolvePlace(queryParam);
    if (!hit) {
      return {
        origin: KATHMANDU,
        error: `No Nepal place matched “${queryParam}”. Showing Kathmandu.`,
      };
    }
    return { origin: hit, error: null as string | null };
  }, [queryParam]);

  const [draft, setDraft] = useState(queryParam ?? "");
  const [origin, setOrigin] = useState<PlaceHit>(initial.origin);
  const [placeError, setPlaceError] = useState<string | null>(initial.error);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const seenQuery = useRef(queryParam);

  useEffect(() => {
    if (seenQuery.current === queryParam) return;
    seenQuery.current = queryParam;
    setOrigin(initial.origin);
    setPlaceError(initial.error);
    setDraft(queryParam ? initial.origin.label : "");
  }, [queryParam, initial]);

  const writeUrl = useCallback(
    (nextSection: Section, q: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextSection === "ev") params.delete("section");
      else params.set("section", nextSection);
      if (q) params.set("q", q);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const selectSection = (next: Section) => {
    writeUrl(next, searchParams.get("q"));
  };

  const onTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = SECTIONS.findIndex((item) => item.id === section);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % SECTIONS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + SECTIONS.length) % SECTIONS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = SECTIONS.length - 1;
    const id = SECTIONS[next].id;
    selectSection(id);
    document.getElementById(`tab-${id}`)?.focus();
  };

  const findPlace = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setOrigin(KATHMANDU);
      setPlaceError(null);
      setDraft("");
      writeUrl(section, null);
      return;
    }
    const hit = resolvePlace(trimmed);
    if (!hit) {
      setPlaceError(
        `No Nepal place matched “${trimmed}”. Try Kathmandu, Patan, Pokhara, Chitwan, or Butwal.`
      );
      return;
    }
    setPlaceError(null);
    setOrigin(hit);
    setDraft(hit.label);
    writeUrl(section, hit.label);
  };

  const useMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Location is not available in this browser. Type a city instead.");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const here: PlaceHit = {
          label: "Your location",
          lat,
          lng,
          kind: "geolocation",
          city: null,
          district: null,
          province: null,
        };
        setOrigin(here);
        setDraft("");
        setPlaceError(null);
        setGeoBusy(false);
        const named = await reverseGeocode(lat, lng);
        const resolved = named ? resolvePlace(named) : null;
        setOrigin({
          ...here,
          label: named ?? "Your location",
          city: resolved?.city ?? null,
          district: resolved?.district ?? null,
          province: resolved?.province ?? null,
        });
        if (named) setDraft(named);
      },
      () => {
        setGeoBusy(false);
        setGeoError("Location access was blocked. Type a city instead.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <a href="#nepal-results" className="skip-link">
        Skip to results
      </a>
      <section className="space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center text-[var(--accent)]">
            <SketchPin className="h-9 w-9" />
          </div>
          <p className="text-sm tracking-wide text-[var(--ink-faint)]">
            Nepal · EV charging, jobs, learning, and events
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--graphite)] sm:text-5xl">
            Where should we look?
          </h1>
        </div>

        <form
          className="mx-auto max-w-lg space-y-4 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            findPlace(draft);
          }}
        >
          <div className="space-y-2">
            <label htmlFor="place" className="sr-only">
              City, district, or area in Nepal
            </label>
            <input
              id="place"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Kathmandu, Pokhara, Patan, Chitwan…"
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
                <span className="text-sm text-[var(--ink-faint)]">{geoError}</span>
              ) : null}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--graphite)] px-5 py-4 text-base font-medium text-[var(--paper)] transition hover:bg-[var(--accent)]"
          >
            Find nearby
          </button>
        </form>
        {placeError ? (
          <p className="text-sm text-[var(--ink-muted)]">{placeError}</p>
        ) : null}
        <p className="text-sm text-[var(--ink-faint)]">
          <Link href="/worldwide" className="ink-link">
            Worldwide jobs and meetups
          </Link>
        </p>
      </section>

      <div
        className="segment mt-10"
        role="tablist"
        aria-label="What to find in Nepal"
        onKeyDown={onTabKey}
      >
        {SECTIONS.map((item) => {
          const selected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls="nepal-results"
              tabIndex={selected ? 0 : -1}
              className={selected ? "segment-btn segment-btn-on" : "segment-btn"}
              onClick={() => selectSection(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="sketch-card mt-8 overflow-hidden px-5 pb-3 pt-4 sm:px-6">
        <div className="mb-1 flex items-center gap-2">
          <SketchPin className="h-4 w-4 text-[var(--accent)]" />
          <p className="font-display text-lg font-medium tracking-tight">
            Looking around {origin.label}
          </p>
        </div>
        <div className="text-[var(--ink-faint)]">
          <CityHorizon className="h-14 w-full" stroke="currentColor" label={origin.label} />
        </div>
      </div>

      <div
        id="nepal-results"
        role="tabpanel"
        aria-labelledby={`tab-${section}`}
        className="mt-8"
      >
        {section === "ev" ? <EvPanel origin={origin} /> : null}
        {section === "jobs" ? <JobsPanel origin={origin} /> : null}
        {section === "learn" ? <LearnPanel origin={origin} /> : null}
        {section === "events" ? <EventsPanel origin={origin} /> : null}
      </div>
    </div>
  );
}
