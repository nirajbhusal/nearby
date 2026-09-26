"use client";

import dynamic from "next/dynamic";
import { Suspense, use, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BASE_PATH } from "@/lib/base-path";
import { readChargeState, writeChargeSearch, type ChargeState } from "@/lib/nepal/charge-query";
import {
  PLUG_FILTERS,
  activeFilterCount,
  evIndex,
  networkLabel,
  stationsInScope,
  stationsNear,
  type NearbyStation,
  type PlugFilter,
} from "@/lib/nepal/ev";
import {
  accessCopy,
  formatKm,
  formatUpdated,
  phoneHref,
  speedLabel,
  stationCaution,
} from "@/lib/nepal/format";
import { haversineKm } from "@/lib/geo";
import { defaultRadiusKm, resolvePlace, suggestPlaces } from "@/lib/nepal/places";
import { reverseGeocode } from "@/lib/reverse-geocode";
import type { EvStation, PlaceHit } from "@/lib/nepal/types";
import { NavigateLinks } from "@/components/nepal/NavigateLinks";
import { ThemeToggle } from "@/components/ThemeToggle";

const ChargeMap = dynamic(() => import("@/components/charge/ChargeMap"), {
  ssr: false,
  loading: () => (
    <div className="charge-map">
      <div className="map-skeleton" role="status" aria-label="Loading map" />
    </div>
  ),
});

const RECENT_KEY = "nearby-recent-places";
const EMPTY_RECENT: string[] = [];
let recentCache = EMPTY_RECENT;
let recentRaw = "";

function readRecent(): string[] {
  if (typeof window === "undefined") return EMPTY_RECENT;
  const raw = window.localStorage.getItem(RECENT_KEY) ?? "[]";
  if (raw === recentRaw) return recentCache;
  recentRaw = raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    recentCache = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 6)
      : EMPTY_RECENT;
  } catch {
    recentCache = EMPTY_RECENT;
  }
  return recentCache;
}

function rememberPlace(label: string) {
  const next = [label, ...readRecent().filter((item) => item !== label)].slice(0, 6);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  recentRaw = "";
  window.dispatchEvent(new Event("nearby-recent"));
}

function subscribeRecent(onStoreChange: () => void) {
  window.addEventListener("nearby-recent", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("nearby-recent", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

type Snap = "peek" | "half" | "full";

let extrasPromise: Promise<Map<string, EvStation>> | null = null;

function loadExtras() {
  extrasPromise ??= import("@/data/nepal/ev-stations.json").then((mod) => {
    const rows = mod.default as EvStation[];
    return new Map(rows.map((row) => [row.id, row]));
  });
  return extrasPromise;
}

function StationExtras({ id }: { id: string }) {
  const extras = use(loadExtras());
  const extra = extras.get(id);
  if (!extra) return null;
  return (
    <div className="station-more-block">
      <p>
        <span className="meta-label">Hours</span>
        {extra.open_hours || "Hours not listed"}
      </p>
      {extra.fee ? (
        <p>
          <span className="meta-label">Listed fee</span>
          {extra.fee}
        </p>
      ) : null}
      {extra.sources.length > 0 ? (
        <ul className="source-list">
          {extra.sources.map((source) => (
            <li key={source.url + source.name}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="fine">Source link not listed.</p>
      )}
      <p className="fine">Curated · last updated {formatUpdated(extra.last_verified)}</p>
    </div>
  );
}

function plugMark(type: string): string {
  if (type === "CCS2") return "CCS";
  if (type.startsWith("GB/T")) return "GB/T";
  if (type === "Type 2") return "T2";
  if (/chademo/i.test(type)) return "CH";
  return "·";
}

export function ChargeExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useMemo(() => readChargeState(searchParams), [searchParams]);
  const stateRef = useRef(state);
  const recent = useSyncExternalStore(subscribeRecent, readRecent, () => EMPTY_RECENT);

  const origin: PlaceHit = useMemo(() => {
    const named = state.q ? resolvePlace(state.q) : null;
    if (state.lat != null && state.lng != null) {
      return {
        label: named?.label ?? (state.q || "Your location"),
        lat: state.lat,
        lng: state.lng,
        kind: "geolocation",
        city: named?.city ?? null,
        district: named?.district ?? null,
        province: named?.province ?? null,
      };
    }
    return named ?? resolvePlace("Kathmandu")!;
  }, [state.q, state.lat, state.lng]);

  const radiusKm = state.radiusSet ? state.radius : defaultRadiusKm(origin);
  const filters = useMemo(
    () => ({
      radiusKm,
      fastOnly: state.fast,
      plugs: state.plugs,
      network: state.network,
    }),
    [radiusKm, state.fast, state.plugs, state.network]
  );
  const stations = useMemo(() => stationsNear(origin, filters), [origin, filters]);
  const scope = useMemo(() => stationsInScope(origin, radiusKm), [origin, radiusKm]);
  const selected = useMemo(() => {
    if (!state.station) return null;
    const inList = stations.find((station) => station.id === state.station);
    if (inList) return inList;
    const raw = evIndex.find((station) => station.id === state.station);
    if (!raw) return null;
    return {
      ...raw,
      distanceKm: haversineKm(origin.lat, origin.lng, raw.lat, raw.lng),
    };
  }, [state.station, stations, origin]);

  const mapStations = useMemo(() => {
    if (!selected || stations.some((station) => station.id === selected.id)) return stations;
    return [...stations, selected];
  }, [stations, selected]);

  const networks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const station of scope) {
      const key = station.network ?? "unbranded";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [scope]);

  const [draft, setDraft] = useState(origin.label);
  const [prevLabel, setPrevLabel] = useState(origin.label);
  if (origin.label !== prevLabel) {
    setPrevLabel(origin.label);
    setDraft(origin.label);
  }
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [snap, setSnap] = useState<Snap>(selected ? "half" : "peek");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; snap: Snap } | null>(null);

  useEffect(() => {
    stateRef.current = state;
  });

  function replace(partial: Partial<ChargeState>) {
    const next = { ...stateRef.current, ...partial };
    const search = writeChargeSearch(next);
    if (search === writeChargeSearch(stateRef.current)) {
      stateRef.current = next;
      return;
    }
    stateRef.current = next;
    router.replace(`/charge${search}`, { scroll: false });
  }

  useEffect(() => {
    if (!state.near) return;
    let cancel = false;
    if (!navigator.geolocation) {
      queueMicrotask(() => {
        if (cancel) return;
        setGeoMessage("Location is not available in this browser. Search a city instead.");
        replace({ near: false });
      });
      return () => {
        cancel = true;
      };
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancel) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const named = await reverseGeocode(lat, lng);
        if (cancel) return;
        const resolved = named ? resolvePlace(named) : null;
        const label = resolved?.label ?? named ?? "Your location";
        if (resolved) rememberPlace(resolved.label);
        setGeoMessage(null);
        replace({
          near: false,
          lat,
          lng,
          q: label,
          station: null,
          radiusSet: false,
        });
      },
      () => {
        if (cancel) return;
        setGeoMessage("Location access was blocked. Search a city, or pick a recent place.");
        replace({ near: false });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
    return () => {
      cancel = true;
    };
    // replace reads the latest query from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.near]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const suggestions = useMemo(() => suggestPlaces(draft), [draft]);
  const showRecent = draft.trim().length === 0 || draft === origin.label;
  const suggestionHits = showRecent ? suggestions.slice(0, 5) : suggestions;

  function choosePlace(hit: PlaceHit) {
    rememberPlace(hit.label);
    setSearchOpen(false);
    setDraft(hit.label);
    setSnap("peek");
    replace({
      q: hit.label,
      lat: null,
      lng: null,
      station: null,
      near: false,
      radiusSet: false,
    });
  }

  function locate() {
    setGeoMessage(null);
    setSearchOpen(false);
    replace({ near: true, station: null });
  }

  function selectStation(id: string) {
    setSnap("half");
    setSearchOpen(false);
    replace({ station: id });
  }

  function togglePlug(id: PlugFilter) {
    const current = stateRef.current.plugs;
    const plugs = current.includes(id)
      ? current.filter((plug) => plug !== id)
      : [...current, id];
    replace({ plugs });
  }

  function clearFilters() {
    replace({ fast: false, plugs: [], network: null });
    setNetworkOpen(false);
  }

  function widen(next: number | null) {
    replace({ radius: next, radiusSet: true });
  }

  async function shareStation(station: NearbyStation) {
    const url = new URL(
      `${BASE_PATH}/charge/${writeChargeSearch({ ...state, station: station.id, near: false })}`,
      window.location.origin
    ).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, text: station.name, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setGeoMessage("Copy the link from the address bar to share this charger.");
    }
  }

  function onHandlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragRef.current = { y: event.clientY, snap };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    const dy = start.y - event.clientY;
    const order: Snap[] = ["peek", "half", "full"];
    let index = order.indexOf(start.snap);
    if (dy > 36) index = Math.min(order.length - 1, index + 1);
    else if (dy < -36) index = Math.max(0, index - 1);
    else index = (index + 1) % order.length;
    setSnap(order[index]);
  }

  const count = stations.length;
  const filterCount = activeFilterCount(filters);
  const scopeText =
    radiusKm == null
      ? origin.kind === "province"
        ? `in ${origin.label}`
        : "in Nepal"
      : `within ${radiusKm} km`;
  const summary = `${count} charger${count === 1 ? "" : "s"} ${scopeText}`;
  const call = selected ? phoneHref(selected.phone) : null;
  const caution = selected ? stationCaution(selected.name, selected.caution) : null;

  return (
    <div className="charge-stage">
      <h1 className="sr-only">EV chargers in Nepal</h1>
      <ChargeMap
        stations={mapStations}
        origin={origin}
        selectedId={selected?.id ?? null}
        showYou={origin.kind === "geolocation"}
        onSelect={selectStation}
      />

      <div className="charge-search" ref={searchRef}>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const pick = suggestionHits[highlight] ?? suggestionHits[0];
            if (pick) choosePlace(pick);
          }}
        >
          <label className="sr-only" htmlFor="charger-search">
            Search a place in Nepal
          </label>
          <input
            id="charger-search"
            value={draft}
            placeholder="Search Kathmandu, Pokhara, Lakeside…"
            autoComplete="off"
            role="combobox"
            aria-expanded={searchOpen}
            aria-controls="place-suggestions"
            aria-autocomplete="list"
            onChange={(event) => {
              setDraft(event.target.value);
              setSearchOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlight((value) => Math.min(suggestionHits.length - 1, value + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight((value) => Math.max(0, value - 1));
              } else if (event.key === "Escape") {
                setSearchOpen(false);
              }
            }}
          />
          <ThemeToggle />
          <button type="button" className="locate-btn" onClick={locate} aria-label="Chargers near me">
            <LocateIcon />
          </button>
        </form>
        {state.near ? (
          <p className="search-note" role="status">
            Finding your location…
          </p>
        ) : null}
        {geoMessage ? (
          <p className="search-note" role="alert">
            {geoMessage}
          </p>
        ) : null}
        {searchOpen ? (
          <ul id="place-suggestions" role="listbox" className="suggest-list">
            {showRecent && recent.length > 0 ? (
              <li className="suggest-label">Recent</li>
            ) : null}
            {showRecent
              ? recent.map((label) => {
                  const hit = resolvePlace(label);
                  if (!hit) return null;
                  return (
                    <li key={`recent-${label}`}>
                      <button type="button" onClick={() => choosePlace(hit)}>
                        {hit.label}
                      </button>
                    </li>
                  );
                })
              : null}
            {suggestionHits.length === 0 ? (
              <li className="suggest-label">No matching place in Nepal</li>
            ) : (
              suggestionHits.map((hit, index) => (
                <li key={`${hit.kind}-${hit.label}-${hit.lat}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlight}
                    className={index === highlight ? "is-hi" : undefined}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => choosePlace(hit)}
                  >
                    <span>{hit.label}</span>
                    <span className="suggest-kind">{hit.kind}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      <section
        className="charge-panel"
        data-snap={snap}
        data-mode={selected ? "station" : "list"}
        aria-label={selected ? selected.name : "Chargers nearby"}
      >
        <button
          type="button"
          className="sheet-handle"
          aria-label={
            snap === "full" ? "Shrink the list" : snap === "half" ? "Expand the list" : "Show the list"
          }
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
        >
          <span className="sheet-grab" />
        </button>

        {selected ? (
          <StationSheet
            station={selected}
            call={call}
            caution={caution}
            copied={copied}
            onBack={() => {
              setSnap("half");
              replace({ station: null });
            }}
            onShare={() => shareStation(selected)}
          />
        ) : (
          <>
            <div className="sheet-summary">
              <p aria-live="polite">{summary}</p>
              {filterCount > 0 ? (
                <button type="button" className="text-btn" onClick={clearFilters}>
                  Clear {filterCount}
                </button>
              ) : (
                <span className="fine">{origin.label}</span>
              )}
            </div>
            <div className="filter-row" role="group" aria-label="Charger filters">
                <button
                  type="button"
                  className={state.fast ? "chip chip-on" : "chip"}
                  aria-pressed={state.fast}
                  onClick={() => replace({ fast: !stateRef.current.fast })}
                >
                  Fast only
                </button>
                {PLUG_FILTERS.map((plug) => (
                  <button
                    key={plug.id}
                    type="button"
                    className={state.plugs.includes(plug.id) ? "chip chip-on" : "chip"}
                    aria-pressed={state.plugs.includes(plug.id)}
                    onClick={() => togglePlug(plug.id)}
                  >
                    {plug.label}
                  </button>
                ))}
                <div className="network-menu">
                  <button
                    type="button"
                    className={state.network ? "chip chip-on" : "chip"}
                    aria-expanded={networkOpen}
                    aria-haspopup="listbox"
                    onClick={() => setNetworkOpen((open) => !open)}
                  >
                    {state.network ? networkLabel(state.network === "unbranded" ? null : state.network) : "Network"}
                  </button>
                  {networkOpen ? (
                    <ul role="listbox" aria-label="Network" className="network-list">
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            replace({ network: null });
                            setNetworkOpen(false);
                          }}
                        >
                          Any network
                        </button>
                      </li>
                      {networks.map(([key, amount]) => (
                        <li key={key}>
                          <button
                            type="button"
                            aria-pressed={state.network === key}
                            onClick={() => {
                              replace({ network: key });
                              setNetworkOpen(false);
                            }}
                          >
                            <span>{key === "unbranded" ? "Unbranded" : key}</span>
                            <span className="fine">{amount}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
            </div>
            <div className="sheet-body">
              {count === 0 ? (
                <div className="empty-block">
                  <p>{emptyCopy(filters, radiusKm)}</p>
                  <div className="widen-row">
                    {radiusKm != null && radiusKm < 50 ? (
                      <button type="button" className="chip" onClick={() => widen(50)}>
                        50 km
                      </button>
                    ) : null}
                    {radiusKm != null && radiusKm < 100 ? (
                      <button type="button" className="chip" onClick={() => widen(100)}>
                        100 km
                      </button>
                    ) : null}
                    {radiusKm != null ? (
                      <button type="button" className="chip" onClick={() => widen(null)}>
                        All in view
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <ul className="station-list">
                  {stations.map((station) => (
                    <li key={station.id}>
                      <button
                        type="button"
                        className="station-row"
                        onClick={() => selectStation(station.id)}
                      >
                        <span className="station-row-main">
                          <span className="station-name">{station.name}</span>
                          <span className="station-meta">
                            {networkLabel(station.network)} · {formatKm(station.distanceKm)}
                          </span>
                        </span>
                        <span className={`speed-badge speed-${station.speed === "slow" || station.speed === "fast" ? station.speed : "unknown"}`}>
                          {station.speed === "fast" ? "Fast" : station.speed === "slow" ? "AC" : "—"}
                        </span>
                        <span className="plug-row" aria-hidden="true">
                          {uniquePlugs(station).map((type) => (
                            <span key={type} className="plug-mark" title={type}>
                              {plugMark(type)}
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StationSheet({
  station,
  call,
  caution,
  copied,
  onBack,
  onShare,
}: {
  station: NearbyStation;
  call: string | null;
  caution: string | null;
  copied: boolean;
  onBack: () => void;
  onShare: () => void;
}) {
  const access = accessCopy(station.access);
  return (
    <div className="station-sheet">
      <div className="station-sheet-top">
        <button type="button" className="text-btn" onClick={onBack}>
          All chargers
        </button>
        <p className={`speed-badge speed-${station.speed === "slow" || station.speed === "fast" ? station.speed : "unknown"}`}>
          {speedLabel(station.speed)}
        </p>
      </div>
      <h2 className="station-title">{station.name}</h2>
      <p className="station-meta">
        {networkLabel(station.network)} · {formatKm(station.distanceKm)}
        {station.city ? ` · ${station.city}` : ""}
      </p>
      <div className="station-actions">
        <NavigateLinks lat={station.lat} lng={station.lng} prominent />
        {call ? (
          <a className="btn-secondary" href={call}>
            Call
          </a>
        ) : null}
        <button type="button" className="btn-secondary" onClick={onShare}>
          {copied ? "Copied" : "Share"}
        </button>
      </div>
      <div className="station-more">
        <ul className="connector-list">
          {station.plugs.length === 0 ? (
            <li>Connectors not listed</li>
          ) : (
            station.plugs.map((plug, index) => (
              <li key={`${plug.type}-${index}`}>
                <span className="plug-mark">{plugMark(plug.type)}</span>
                <span>
                  {plug.type}
                  {plug.kw != null ? ` · ${trimKw(plug.kw)} kW` : ""}
                  {plug.n > 1 ? ` · ×${plug.n}` : plug.n === 1 ? " · ×1" : ""}
                </span>
              </li>
            ))
          )}
        </ul>
        <p>
          <span className="meta-label">Access</span>
          {access.short}
        </p>
        <p className="fine">{access.long}</p>
        {caution ? <p className="fine">{caution}</p> : null}
        {station.address ? <p className="fine">{station.address}</p> : null}
        <Suspense fallback={<div className="skeleton-line" aria-hidden="true" />}>
          <StationExtras id={station.id} />
        </Suspense>
        <p className="coming-soon">Booking and payment — coming soon</p>
        <Link className="fine-link" href={`/ev/${station.id}`}>
          Station page
        </Link>
      </div>
    </div>
  );
}

function emptyCopy(
  filters: { fastOnly: boolean; plugs: PlugFilter[]; radiusKm: number | null },
  radiusKm: number | null
): string {
  const within = radiusKm == null ? "in this search" : `within ${radiusKm} km`;
  if (filters.fastOnly && filters.plugs.length === 0) {
    return radiusKm == null
      ? "No fast chargers in this search."
      : `No fast chargers within ${radiusKm} km; widen the search`;
  }
  if (filters.plugs.length === 1 && filters.plugs[0] === "chademo") {
    return `No CHAdeMO chargers ${within}. Widen the search, or try CCS2 or GB/T.`;
  }
  return `No chargers match these filters ${within}.`;
}

function uniquePlugs(station: NearbyStation): string[] {
  const seen: string[] = [];
  for (const plug of station.plugs) {
    const mark = plug.type.startsWith("GB/T") ? "GB/T" : plug.type;
    if (!seen.includes(mark)) seen.push(mark);
  }
  return seen.slice(0, 3);
}

function trimKw(kw: number): string {
  return Number.isInteger(kw) ? String(kw) : String(Math.round(kw * 10) / 10);
}

function LocateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
