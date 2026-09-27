"use client";

import dynamic from "next/dynamic";
import { Suspense, use, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { List, Map as MapIcon, Zap } from "lucide-react";
import { SiteLink as Link } from "@/components/SiteLink";
import { BASE_PATH } from "@/lib/base-path";
import { readChargeState, writeChargeSearch, type ChargeState } from "@/lib/nepal/charge-query";
import {
  PLUG_FILTERS,
  activeFilterCount,
  defaultStationSort,
  evIndex,
  isApproximate,
  networkLabel,
  networkMonogram,
  sortStations,
  stationsInScope,
  stationsNear,
  type NearbyStation,
  type PlugFilter,
  type StationSort,
} from "@/lib/nepal/ev";
import { directionQuery, networkById, networkChipRows, type NetworkChip } from "@/lib/nepal/networks";
import {
  accessCopy,
  formatUpdated,
  phoneHref,
  sourceLabel,
  speedLabel,
  stationCaution,
} from "@/lib/nepal/format";
import { evReady, formatDistance, stationFitsEv } from "@/lib/local-profile";
import { useProfile, useUnits } from "@/lib/profile-store";
import { DistanceText } from "@/components/DistanceText";
import { FitMark, SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { chargeHref } from "@/lib/item-link";
import { haversineKm } from "@/lib/geo";
import { defaultRadiusKm, NEPAL, resolvePlace, suggestPlaces } from "@/lib/nepal/places";
import {
  MAJOR_CITIES,
  NEPAL_BBOX,
  provinceByName,
  provinceBySlug,
  provinceRecords,
} from "@/lib/nepal/provinces";
import type { MapFrame } from "@/components/charge/ChargeMap";
import { reverseGeocode } from "@/lib/reverse-geocode";
import type { EvStation, PlaceHit } from "@/lib/nepal/types";
import { NavigateLinks } from "@/components/nepal/NavigateLinks";
import { SortControl, StationList } from "@/components/charge/StationList";

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
        <p className="fine">
          Source:{" "}
          {dedupedSources(extra.sources).map((source, index) => (
            <span key={source.url + source.label}>
              {index > 0 ? " · " : null}
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            </span>
          ))}
        </p>
      ) : (
        <p className="fine">Source link not listed.</p>
      )}
      <p className="fine">Curated · last updated {formatUpdated(extra.last_verified)}</p>
    </div>
  );
}

function dedupedSources(sources: { name: string; url: string }[]) {
  const seen = new Set<string>();
  const rows: { label: string; url: string }[] = [];
  for (const source of sources) {
    const label = sourceLabel(source.name);
    if (seen.has(label)) continue;
    seen.add(label);
    rows.push({ label, url: source.url });
  }
  return rows;
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
    if (named) return named;
    const province = provinceBySlug(state.province);
    if (province) {
      return {
        label: province.name,
        lat: province.lat,
        lng: province.lng,
        kind: "province",
        city: null,
        district: null,
        province: province.name,
      };
    }
    return NEPAL;
  }, [state.q, state.lat, state.lng, state.province]);

  const radiusKm = state.radiusSet ? state.radius : defaultRadiusKm(origin);
  const filters = useMemo(
    () => ({
      radiusKm,
      fastOnly: state.fast,
      plugs: state.plugs,
      networks: state.networks,
      exactOnly: state.exact,
    }),
    [radiusKm, state.fast, state.plugs, state.networks, state.exact]
  );
  const stations = useMemo(() => stationsNear(origin, filters), [origin, filters]);
  const profile = useProfile();
  const unit = useUnits();
  const carReady = evReady(profile);
  const [fitsOnly, setFitsOnly] = useState(false);
  const visible = useMemo(() => {
    if (!fitsOnly || !carReady) return stations;
    return stations.filter((station) => stationFitsEv(station, profile));
  }, [stations, fitsOnly, carReady, profile]);
  const [sortPick, setSortPick] = useState<StationSort | null>(null);
  const sortScope = `${origin.kind}|${origin.label}`;
  const [sortScopeSeen, setSortScopeSeen] = useState(sortScope);
  if (sortScope !== sortScopeSeen) {
    setSortScopeSeen(sortScope);
    setSortPick(null);
  }
  const sort = sortPick ?? defaultStationSort(origin.kind);
  const ordered = useMemo(() => sortStations(visible, sort), [visible, sort]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
    if (!selected || visible.some((station) => station.id === selected.id)) return visible;
    return [...visible, selected];
  }, [visible, selected]);

  const networkCounts = useMemo(() => {
    const rows = stationsNear(origin, { ...filters, networks: [] });
    const counts = new Map<string, number>();
    for (const station of rows) {
      const id = station.network_id || "unbranded";
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [origin, filters]);

  const scopeLabel = origin.kind === "country" ? "" : origin.label;
  const [draft, setDraft] = useState(scopeLabel);
  const [prevLabel, setPrevLabel] = useState(scopeLabel);
  if (scopeLabel !== prevLabel) {
    setPrevLabel(scopeLabel);
    setDraft(scopeLabel);
  }
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const urlSnap: Snap = state.sheet ?? (selected ? "half" : "peek");
  const snapKey = `${state.sheet ?? ""}|${state.station ?? ""}`;
  const snapKeyRef = useRef(snapKey);
  const [snap, setSnapState] = useState<Snap>(urlSnap);
  useEffect(() => {
    if (snapKeyRef.current === snapKey) return;
    snapKeyRef.current = snapKey;
    setSnapState(urlSnap);
  }, [snapKey, urlSnap]);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreNetworks, setMoreNetworks] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ y: number; snap: Snap; height: number; t: number } | null>(null);

  useEffect(() => {
    stateRef.current = state;
  });

  function setSnap(next: Snap) {
    setSnapState(next);
    const fallback: Snap = stateRef.current.station ? "half" : "peek";
    const sheet = next === fallback ? null : next;
    if ((stateRef.current.sheet ?? null) === sheet) return;
    replace({ sheet });
  }

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
    if (state.q || state.province || state.near || state.lat != null || state.station) return;
    let cancel = false;
    const permissions = navigator.permissions;
    if (!permissions?.query) return;
    permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancel || status.state !== "granted") return;
        replace({ near: true });
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.q, state.province, state.near, state.lat, state.station]);

  useEffect(() => {
    const root = document.querySelector(".charge-stage, .charge-list-page");
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(".h-scroll")];
    const update = (node: HTMLElement) => {
      const overflow = node.scrollWidth - node.clientWidth > 8;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 8;
      node.classList.toggle("is-fade", overflow && !atEnd);
    };
    const stops: Array<() => void> = [];
    for (const node of nodes) {
      const onScroll = () => update(node);
      update(node);
      node.addEventListener("scroll", onScroll, { passive: true });
      const observer = new ResizeObserver(() => update(node));
      observer.observe(node);
      stops.push(() => {
        node.removeEventListener("scroll", onScroll);
        observer.disconnect();
      });
    }
    return () => stops.forEach((stop) => stop());
  }, [filtersOpen, moreNetworks, state.view, state.networks, ordered.length]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("pointerdown", onPointer, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const suggestions = useMemo(() => suggestPlaces(draft), [draft]);
  const showRecent = draft.trim().length === 0 || draft === origin.label;
  const suggestionHits = showRecent ? suggestions.slice(0, 5) : suggestions;

  function choosePlace(hit: PlaceHit) {
    rememberPlace(hit.label);
    setSearchOpen(false);
    setDraft(hit.label);
    setSnapState("peek");
    replace({
      sheet: null,
      q: hit.label,
      province: null,
      lat: null,
      lng: null,
      station: null,
      near: false,
      radiusSet: false,
    });
  }

  function chooseProvince(slug: string) {
    setSearchOpen(false);
    setDraft("");
    setSnapState("peek");
    replace({
      sheet: null,
      province: slug,
      q: "",
      lat: null,
      lng: null,
      station: null,
      near: false,
      radiusSet: false,
    });
  }

  function chooseNepal() {
    setSearchOpen(false);
    setDraft("");
    setSnapState("peek");
    replace({
      sheet: null,
      province: null,
      q: "",
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
    setHoveredId(null);
    setSnapState("half");
    setSearchOpen(false);
    replace({ station: id, sheet: null, view: "map" });
  }

  function togglePlug(id: PlugFilter) {
    const current = stateRef.current.plugs;
    const plugs = current.includes(id)
      ? current.filter((plug) => plug !== id)
      : [...current, id];
    replace({ plugs });
  }

  function clearFilters() {
    setFitsOnly(false);
    replace({ fast: false, plugs: [], networks: [], exact: false });
    setFiltersOpen(false);
  }

  function toggleNetwork(id: string) {
    const current = stateRef.current.networks;
    const networks = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    replace({ networks });
  }

  function widen(next: number | null) {
    replace({ radius: next, radiusSet: true });
  }

  async function shareStation(station: NearbyStation) {
    const url = new URL(`${BASE_PATH}${chargeHref(station.id)}`, window.location.origin).toString();
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
    const panel = panelRef.current;
    dragRef.current = {
      y: event.clientY,
      snap,
      height: panel?.getBoundingClientRect().height ?? 0,
      t: performance.now(),
    };
    panel?.classList.add("is-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    const panel = panelRef.current;
    if (!start || !panel) return;
    const next = Math.min(window.innerHeight - 96, Math.max(120, start.height + (start.y - event.clientY)));
    panel.style.height = `${next}px`;
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    dragRef.current = null;
    const panel = panelRef.current;
    panel?.classList.remove("is-dragging");
    if (!start) return;
    const dy = start.y - event.clientY;
    const velocity = dy / Math.max(1, performance.now() - start.t);
    const order: Snap[] = ["peek", "half", "full"];
    let index = order.indexOf(start.snap);
    if (Math.abs(dy) < 12 && Math.abs(velocity) < 0.2) index = (index + 1) % order.length;
    else if (dy > 28 || velocity > 0.45) index = Math.min(order.length - 1, index + 1);
    else if (dy < -28 || velocity < -0.45) index = Math.max(0, index - 1);
    if (panel) panel.style.height = "";
    setSnap(order[index]);
  }

  const listMode = state.view === "list";
  const count = visible.length;
  const filterCount = activeFilterCount(filters) + (fitsOnly && carReady ? 1 : 0);
  const within = radiusKm == null ? "" : formatDistance(radiusKm, unit);
  const summary =
    origin.kind === "province"
      ? `${count} in ${origin.label}`
      : origin.kind === "country" || radiusKm == null
        ? origin.kind === "country"
          ? `${count} charger${count === 1 ? "" : "s"}`
          : `${count} charger${count === 1 ? "" : "s"} in ${origin.label}`
        : origin.kind === "geolocation"
          ? `${count} charger${count === 1 ? "" : "s"} within ${within}`
          : `${count} within ${within} of ${origin.label}`;
  const frame: MapFrame =
    origin.kind === "country"
      ? { mode: "bounds", bbox: NEPAL_BBOX }
      : origin.kind === "province"
        ? { mode: "bounds", bbox: (provinceByName(origin.province)?.bbox ?? NEPAL_BBOX) }
        : { mode: "point", lng: origin.lng, lat: origin.lat, zoom: origin.kind === "geolocation" ? 13 : 13 };
  const showDistance =
    origin.kind === "geolocation" || origin.kind === "city" || origin.kind === "area" || origin.kind === "district";
  const cityChips = MAJOR_CITIES.map((name) => {
    const hit = resolvePlace(name);
    return {
      name,
      count: hit ? stationsInScope(hit, defaultRadiusKm(hit)).length : 0,
    };
  }).filter((chip) => chip.count > 0);
  const call = selected ? phoneHref(selected.phone) : null;
  const caution = selected ? stationCaution(selected.name, selected.caution) : null;
  const viewToggle = (
    <div className="seg" role="tablist" aria-label="Charger view">
      {(
        [
          { id: "map" as const, label: "Map", icon: <MapIcon size={16} strokeWidth={1.75} aria-hidden /> },
          { id: "list" as const, label: "List", icon: <List size={16} strokeWidth={1.75} aria-hidden /> },
        ]
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={state.view === option.id}
          className={state.view === option.id ? "is-on" : undefined}
          onClick={() => replace({ view: option.id })}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );

  const chipRows = networkChipRows(networkCounts);
  const showMore =
    moreNetworks || state.networks.some((id) => chipRows.more.some((chip) => chip.id === id));

  function networkRow() {
    return (
      <NetworkChipRow
        primary={chipRows.primary}
        moreChips={chipRows.more}
        showMore={showMore}
        selected={state.networks}
        onToggle={toggleNetwork}
        onClear={() => replace({ networks: [] })}
        onMore={() => setMoreNetworks((open) => !open)}
      />
    );
  }

  const filterSheet = filtersOpen ? (
    <div className="filter-sheet">
      <p className="network-label">Network</p>
      {networkRow()}
      <button
        type="button"
        className={state.exact ? "chip chip-on" : "chip"}
        aria-pressed={state.exact}
        onClick={() => replace({ exact: !stateRef.current.exact })}
      >
        Exact locations only
      </button>
    </div>
  ) : null;

  const filterChips = (
    <FilterChips
      fast={state.fast}
      plugs={state.plugs}
      filtersOpen={filtersOpen}
      filtersMarked={filtersOpen || state.exact}
      fits={fitsOnly}
      showFits={carReady}
      onFits={() => setFitsOnly((on) => !on)}
      onFast={() => replace({ fast: !stateRef.current.fast })}
      onPlug={togglePlug}
      onFilters={() => setFiltersOpen((open) => !open)}
    />
  );

  const searchPanel = (
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
            Search a place
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
            onFocus={() => {
              setSearchOpen(true);
              if (!listMode && snap !== "full") setSnap("full");
            }}
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
          {listMode ? (
            <button type="button" className="locate-btn" onClick={locate} aria-label="Chargers near me">
              <LocateIcon />
            </button>
          ) : (
            <button type="button" className="peek-cards" onClick={() => replace({ view: "list" })}>
              <List size={16} strokeWidth={1.75} aria-hidden />
              List
            </button>
          )}
        </form>
        <div className="scope-row h-scroll" role="group" aria-label="Scope">
          <button
            type="button"
            className={origin.kind === "country" ? "chip chip-on" : "chip"}
            aria-pressed={origin.kind === "country"}
            onClick={chooseNepal}
          >
            All {evIndex.length}
          </button>
          {provinceRecords.map((province) => {
            const on = origin.kind === "province" && origin.province === province.name;
            return (
              <button
                key={province.slug}
                type="button"
                className={on ? "chip chip-on" : "chip"}
                aria-pressed={on}
                onClick={() => chooseProvince(province.slug)}
              >
                {province.name} {province.count}
              </button>
            );
          })}
          {cityChips.map((city) => {
            const on = origin.kind === "city" && origin.city === city.name;
            return (
              <button
                key={city.name}
                type="button"
                className={on ? "chip chip-on" : "chip"}
                aria-pressed={on}
                onClick={() => {
                  const hit = resolvePlace(city.name);
                  if (hit) choosePlace(hit);
                }}
              >
                {city.name} {city.count}
              </button>
            );
          })}
        </div>
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
              <li className="suggest-label">No matching place</li>
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

  );

  return (
    <div className={listMode ? "charge-list-page charge-cards-page" : "charge-stage"}>
      <h1 className="sr-only">EV chargers</h1>
      {listMode ? null : (
        <ChargeMap
          stations={mapStations}
          origin={origin}
          frame={frame}
          selectedId={selected?.id ?? null}
          hoveredId={hoveredId}
          showYou={origin.kind === "geolocation"}
          provinces={
            origin.kind === "country"
              ? provinceRecords.map((province) => ({
                  slug: province.slug,
                  name: province.name,
                  lat: province.lat,
                  lng: province.lng,
                  count: province.count,
                }))
              : null
          }
          onSelect={selectStation}
          onProvince={chooseProvince}
          onLocate={locate}
        />
      )}

      {listMode ? (
        <div className="charge-card-board">
          <div className="cards-toggle">{viewToggle}</div>
          {searchPanel}
          <div className="filter-row h-scroll" role="group" aria-label="Charger filters">
            {filterChips}
          </div>
          {filterSheet}
          <div className="sheet-summary-inline list-head">
            <p aria-live="polite">{summary}</p>
            <div className="list-head-tools">
              <SortControl value={sort} onChange={setSortPick} />
              {filterCount > 0 ? (
                <button type="button" className="text-btn" onClick={clearFilters}>
                  Clear {filterCount}
                </button>
              ) : null}
            </div>
          </div>
          {networkRow()}
          {count === 0 ? (
            <p className="empty-inline">{emptyCopy(filters, radiusKm, fitsOnly && carReady)}</p>
          ) : (
            <StationList
              stations={ordered}
              showDistance={showDistance}
              unit={unit}
              selectedId={selected?.id ?? null}
              fits={(station) => stationFitsEv(station, profile)}
              onSelect={selectStation}
              onHover={setHoveredId}
            />
          )}
        </div>
      ) : (
      <section
        ref={panelRef}
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
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        >
          <span className="sheet-grab" />
        </button>
        <div className="panel-tools">{viewToggle}</div>

        {selected ? (
          <StationSheet
            station={selected}
            fits={stationFitsEv(selected, profile)}
            showDistance={showDistance}
            call={call}
            caution={caution}
            copied={copied}
            onBack={() => {
              setSnapState("half");
              replace({ station: null, sheet: "half" });
            }}
            onShare={() => shareStation(selected)}
          />
        ) : (
          <>
            {searchPanel}
            <div className="sheet-summary list-head">
              <p aria-live="polite">{summary}</p>
              <div className="list-head-tools">
                <SortControl value={sort} onChange={setSortPick} />
                {filterCount > 0 ? (
                  <button type="button" className="text-btn" onClick={clearFilters}>
                    Clear {filterCount}
                  </button>
                ) : origin.kind === "country" ? null : (
                  <span className="fine">{origin.label}</span>
                )}
              </div>
            </div>
            {networkRow()}
            <div className="filter-row h-scroll" role="group" aria-label="Charger filters">
              {filterChips}
            </div>
            {filterSheet}
            <div className="sheet-body">
              {count === 0 ? (
                <div className="empty-block">
                  <p>{emptyCopy(filters, radiusKm, fitsOnly && carReady)}</p>
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
                <StationList
                  stations={ordered}
                  showDistance={showDistance}
                  unit={unit}
                  selectedId={state.station}
                  fits={(station) => stationFitsEv(station, profile)}
                  onSelect={selectStation}
                  onHover={setHoveredId}
                />
              )}
            </div>
          </>
        )}
      </section>
      )}
    </div>
  );
}

function FilterChips({
  fast,
  plugs,
  filtersOpen,
  filtersMarked,
  fits,
  showFits,
  onFits,
  onFast,
  onPlug,
  onFilters,
}: {
  fast: boolean;
  plugs: PlugFilter[];
  filtersOpen: boolean;
  filtersMarked: boolean;
  fits: boolean;
  showFits: boolean;
  onFits: () => void;
  onFast: () => void;
  onPlug: (id: PlugFilter) => void;
  onFilters: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={filtersMarked ? "chip chip-on" : "chip"}
        aria-expanded={filtersOpen}
        onClick={onFilters}
      >
        Filters
      </button>
      {showFits ? (
        <button type="button" className={fits ? "chip chip-on" : "chip"} aria-pressed={fits} onClick={onFits}>
          Fits my car
        </button>
      ) : null}
      <button type="button" className={fast ? "chip chip-on" : "chip"} aria-pressed={fast} onClick={onFast}>
        Fast only
      </button>
      {PLUG_FILTERS.map((plug) => (
        <button
          key={plug.id}
          type="button"
          className={plugs.includes(plug.id) ? "chip chip-on" : "chip"}
          aria-pressed={plugs.includes(plug.id)}
          onClick={() => onPlug(plug.id)}
        >
          {plug.label}
        </button>
      ))}
    </>
  );
}

function NetworkChipRow({
  primary,
  moreChips,
  showMore,
  selected,
  onToggle,
  onClear,
  onMore,
}: {
  primary: NetworkChip[];
  moreChips: NetworkChip[];
  showMore: boolean;
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onMore: () => void;
}) {
  const chips = showMore ? [...primary, ...moreChips] : primary;
  return (
    <div className="network-quick h-scroll" role="group" aria-label="Network">
      <button
        type="button"
        className={selected.length === 0 ? "chip chip-on" : "chip"}
        aria-pressed={selected.length === 0}
        onClick={onClear}
      >
        All
      </button>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          data-network={chip.id}
          className={selected.includes(chip.id) ? "chip chip-on" : "chip"}
          aria-pressed={selected.includes(chip.id)}
          onClick={() => onToggle(chip.id)}
        >
          {chip.label}
          <span className="chip-count">{chip.count}</span>
        </button>
      ))}
      <button type="button" className={showMore ? "chip chip-on" : "chip"} aria-expanded={showMore} onClick={onMore}>
        More
      </button>
    </div>
  );
}

function StationSheet({
  station,
  fits,
  showDistance,
  call,
  caution,
  copied,
  onBack,
  onShare,
}: {
  station: NearbyStation;
  fits: boolean;
  showDistance: boolean;
  call: string | null;
  caution: string | null;
  copied: boolean;
  onBack: () => void;
  onShare: () => void;
}) {
  const access = accessCopy(station.access);
  const network = networkById(station.network_id);
  const mono = networkMonogram(station.network_id || station.network);
  const approx = isApproximate(station);
  const apps = network ? [network.apps.ios, network.apps.android].filter(Boolean) : [];
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
      <h2 className="station-title">
        {station.name}
        {fits ? <FitMark /> : null}
      </h2>
      <p className="station-meta">
        {network?.name || networkLabel(station.network)}
        {showDistance ? (
          <>
            {" · "}
            <DistanceText km={station.distanceKm} />
          </>
        ) : null}
        {station.city ? ` · ${station.city}` : ""}
      </p>
      {approx ? <p className="approx-note">Approximate location (town only)</p> : null}
      <div className="network-card">
        <span className="net-icon" aria-hidden="true">
          {mono ? <span className="mono">{mono}</span> : <Zap size={16} strokeWidth={1.75} />}
        </span>
        <div>
          <p className="network-name">{network?.name || networkLabel(station.network)}</p>
          {network?.full_name && network.full_name !== network.name ? (
            <p className="fine">{network.full_name}</p>
          ) : null}
          {network?.website ? (
            <a className="ink-link" href={network.website} target="_blank" rel="noopener noreferrer">
              {network.website.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          {apps.length > 0 ? (
            <p className="app-links">
              Get the app
              {network?.apps.ios ? (
                <a href={network.apps.ios} target="_blank" rel="noopener noreferrer">
                  iOS
                </a>
              ) : null}
              {network?.apps.android ? (
                <a href={network.apps.android} target="_blank" rel="noopener noreferrer">
                  Android
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <div className="station-actions">
        <SaveButton item={chargerSave(station)} />
        <ShareButton title={station.name} url={chargeHref(station.id)} />
        <NavigateLinks
          lat={station.lat}
          lng={station.lng}
          name={station.name}
          search={approx ? directionQuery(station) : null}
        />
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

function chargerSave(station: NearbyStation) {
  return {
    id: station.id,
    kind: "charger" as const,
    title: station.name,
    subtitle: station.city ?? "",
    href: chargeHref(station.id),
  };
}

function emptyCopy(
  filters: { fastOnly: boolean; plugs: PlugFilter[]; radiusKm: number | null },
  radiusKm: number | null,
  fits: boolean
): string {
  const within = radiusKm == null ? "in this search" : `within ${radiusKm} km`;
  if (fits) return `No chargers fit your car ${within}.`;
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
