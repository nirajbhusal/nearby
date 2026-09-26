"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { SiteLink as Link } from "@/components/SiteLink";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventsPanel } from "@/components/nepal/EventsPanel";
import { JobsPanel } from "@/components/nepal/JobsPanel";
import { LearnPanel } from "@/components/nepal/LearnPanel";
import { useProfile } from "@/lib/profile-store";
import { KATHMANDU, resolvePlace, suggestPlaces } from "@/lib/nepal/places";
import { reverseGeocode } from "@/lib/reverse-geocode";
import type { PlaceHit } from "@/lib/nepal/types";

const EMPTY: string[] = [];
let recentCache = EMPTY;
let recentRaw = "";
const RECENT_KEY = "nearby-recent-places";

function readRecent(): string[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(RECENT_KEY) ?? "[]";
  if (raw === recentRaw) return recentCache;
  recentRaw = raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    recentCache = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 6)
      : EMPTY;
  } catch {
    recentCache = EMPTY;
  }
  return recentCache;
}

function rememberPlace(label: string) {
  const next = [label, ...readRecent().filter((item) => item !== label)].slice(0, 6);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  recentRaw = "";
  window.dispatchEvent(new Event("nearby-recent"));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("nearby-recent", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("nearby-recent", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

const COPY = {
  jobs: {
    kicker: "Jobs",
    title: "Tech work nearby",
    intro: "Tech roles around a city.",
  },
  learn: {
    kicker: "Learn",
    title: "Places to learn AI",
    intro: "Campuses, bootcamps, and communities. Online programs stay in the list even when you search a city.",
  },
  events: {
    kicker: "Events",
    title: "What’s on nearby",
    intro: "Upcoming meetups and conferences, series that happen regularly, and a collapsed list of recent ones.",
  },
} as const;

export function SectionPage({ section }: { section: "jobs" | "learn" | "events" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const profile = useProfile();
  const home = !q && profile.homeCity ? resolvePlace(profile.homeCity) : null;
  const resolved = q ? resolvePlace(q) : null;
  const origin = resolved ?? home ?? KATHMANDU;
  const copy = COPY[section];
  const recent = useSyncExternalStore(subscribe, readRecent, () => EMPTY);
  const shown = q || origin.label;
  const [draft, setDraft] = useState(shown);
  const [prevShown, setPrevShown] = useState(shown);
  if (shown !== prevShown) {
    setPrevShown(shown);
    setDraft(shown);
  }
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const suggestions = useMemo(() => suggestPlaces(draft), [draft]);

  function go(hit: PlaceHit) {
    rememberPlace(hit.label);
    setOpen(false);
    setDraft(hit.label);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("q", hit.label);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function locate() {
    setMessage(null);
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser. Search a city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const named = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        const hit = (named && resolvePlace(named)) || null;
        if (!hit) {
          setMessage("That location is outside the places Nearby knows. Search a city.");
          return;
        }
        go(hit);
      },
      () => setMessage("Location access was blocked. Search a city, or pick a recent place."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <main className="page-wrap">
      <header className="page-hero">
        <p className="eyebrow">{copy.kicker}</p>
        <h1 className="font-display page-title">{copy.title}</h1>
        <p className="lede">{copy.intro}</p>
        {section === "events" ? (
          <p className="fine">
            Looking for a class instead? <Link href="/learn">Places to learn AI</Link>
          </p>
        ) : null}
        <form
          className="page-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const hit = suggestions[0];
            if (hit) go(hit);
            else setMessage("No matching place. Try Kathmandu, Pokhara, or Patan.");
          }}
        >
          <label className="sr-only" htmlFor={`${section}-place`}>
            Place
          </label>
          <input
            id={`${section}-place`}
            value={draft}
            placeholder="Kathmandu, Pokhara, Chitwan…"
            autoComplete="off"
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          <button type="button" className="btn-secondary" onClick={locate}>
            Near me
          </button>
        </form>
        {q && !resolved ? (
          <p className="search-note" role="status">
            No match for “{q}”. Showing Kathmandu.
          </p>
        ) : null}
        {message ? (
          <p className="search-note" role="alert">
            {message}
          </p>
        ) : null}
        {open && (draft.trim() === "" || suggestions.length > 0 || recent.length > 0) ? (
          <ul className="suggest-list suggest-inline">
            {recent.slice(0, 4).map((label) => {
              const hit = resolvePlace(label);
              if (!hit) return null;
              return (
                <li key={label}>
                  <button type="button" onClick={() => go(hit)}>
                    {hit.label}
                  </button>
                </li>
              );
            })}
            {suggestions.slice(0, 6).map((hit) => (
              <li key={`${hit.kind}-${hit.label}`}>
                <button type="button" onClick={() => go(hit)}>
                  {hit.label}
                  <span className="suggest-kind">{hit.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      {section === "jobs" ? <JobsPanel origin={origin} /> : null}
      {section === "learn" ? <LearnPanel origin={origin} /> : null}
      {section === "events" ? <EventsPanel origin={origin} /> : null}
    </main>
  );
}
