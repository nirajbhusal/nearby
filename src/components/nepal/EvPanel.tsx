"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { NavigateLinks } from "@/components/nepal/NavigateLinks";
import { PlugIcon } from "@/components/illustrations/PlugIcon";
import { EmptySketch } from "@/components/illustrations/EmptySketch";
import {
  connectorRank,
  emptyEvFilters,
  networkLabel,
  stationsInScope,
  stationsNear,
  type EvFilters,
  type NearbyStation,
} from "@/lib/nepal/ev";
import {
  accessCopy,
  formatKm,
  phoneHref,
  plugLine,
  speedLabel,
} from "@/lib/nepal/format";
import type { PlaceHit } from "@/lib/nepal/types";

const StationMap = dynamic(() => import("@/components/nepal/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="sketch-card nepal-map flex items-center justify-center text-sm text-[var(--ink-faint)]">
      Loading map…
    </div>
  ),
});

const RADIUS_OPTIONS: { label: string; value: number | null }[] = [
  { label: "15 km", value: 15 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "All Nepal", value: null },
];

function StationCard({
  station,
  active,
  onSelect,
}: {
  station: NearbyStation;
  active: boolean;
  onSelect: () => void;
}) {
  const access = accessCopy(station.access);
  const call = phoneHref(station.phone);
  return (
    <article
      id={`station-${station.id}`}
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`station-card cursor-pointer border-b border-[var(--line-soft)] py-5 outline-none last:border-b-0 focus-visible:rounded-lg ${
        active ? "bg-[color-mix(in_srgb,var(--accent-soft)_35%,transparent)] px-3 -mx-3" : ""
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-[var(--accent)]">
          {formatKm(station.distanceKm)}
        </p>
        <p className="text-xs tracking-wide text-[var(--ink-faint)]">
          {speedLabel(station.speed)}
        </p>
      </div>
      <h3 className="mt-1 text-lg font-medium tracking-tight text-[var(--graphite)]">
        <Link
          href={`/ev/${station.id}`}
          className="hover:text-[var(--accent)]"
          onClick={(event) => event.stopPropagation()}
          prefetch={false}
        >
          {station.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {[station.address, station.city].filter(Boolean).join(" · ")}
      </p>
      {station.network || station.operator ? (
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {[station.network, station.operator].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-[var(--graphite)]">{plugLine(station.plugs)}</p>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">{access.short}</p>
      {station.caution ? (
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{station.caution}</p>
      ) : null}
      <div
        className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"
        onClick={(event) => event.stopPropagation()}
      >
        <NavigateLinks lat={station.lat} lng={station.lng} />
        {call ? (
          <a href={call} className="ink-link text-sm">
            Call
          </a>
        ) : null}
        <Link href={`/ev/${station.id}`} className="ink-link text-sm" prefetch={false}>
          Details
        </Link>
      </div>
    </article>
  );
}

export function EvPanel({ origin }: { origin: PlaceHit }) {
  const [filters, setFilters] = useState<EvFilters>(() => emptyEvFilters(origin));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focus, setFocus] = useState<"map" | "list" | null>(null);
  const [limit, setLimit] = useState(12);
  const originKey = `${origin.kind}:${origin.label}:${origin.lat.toFixed(4)}`;
  const seenOrigin = useRef(originKey);

  useEffect(() => {
    if (seenOrigin.current === originKey) return;
    seenOrigin.current = originKey;
    setFilters(emptyEvFilters(origin));
    setActiveId(null);
    setFocus(null);
    setLimit(12);
  }, [origin, originKey]);

  const scope = useMemo(
    () => stationsInScope(origin, filters.radiusKm, filters.province),
    [origin, filters.radiusKm, filters.province]
  );

  const results = useMemo(
    () => stationsNear(origin, filters),
    [origin, filters]
  );

  const connectors = useMemo(() => {
    const names = new Set<string>();
    for (const station of scope) {
      for (const plug of station.plugs) names.add(plug.type);
    }
    return [...names].sort((a, b) => connectorRank(a) - connectorRank(b) || a.localeCompare(b));
  }, [scope]);

  const networks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const station of scope) {
      const key = station.network ?? "unbranded";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [scope]);

  const provinces = useMemo(() => {
    const names = new Set<string>();
    for (const station of scope) {
      if (station.province) names.add(station.province);
    }
    return [...names].sort();
  }, [scope]);

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const station of scope) {
      if (!station.city) continue;
      if (filters.province && station.province !== filters.province) continue;
      counts.set(station.city, (counts.get(station.city) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [scope, filters.province]);

  const speeds = useMemo(() => {
    const names = new Set(scope.map((station) => station.speed));
    return (["fast", "slow", "unknown"] as const).filter((speed) => names.has(speed));
  }, [scope]);

  const activeIndex = activeId
    ? results.findIndex((station) => station.id === activeId)
    : -1;
  const shown = Math.max(limit, activeIndex + 1);

  useEffect(() => {
    if (!activeId || focus !== "map") return;
    document.getElementById(`station-${activeId}`)?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeId, focus, shown]);

  const visible = results.slice(0, shown);
  const radiusLabel =
    filters.radiusKm == null ? "across Nepal" : `within ${filters.radiusKm} km`;

  function patch(partial: Partial<EvFilters>) {
    setFilters((current) => ({ ...current, ...partial }));
    setLimit(12);
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <PlugIcon className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="font-display text-lg font-medium tracking-tight">
          EV charging
        </h2>
      </div>
      <p className="text-[15px] leading-relaxed text-[var(--ink-muted)]">
        Nearest stations around {origin.label}, sorted by distance. Most listings
        do not confirm that the charger is public.
      </p>

      <div className="space-y-3">
        <ChipRow label="Distance">
          {RADIUS_OPTIONS.map((option) => (
            <Chip
              key={option.label}
              pressed={filters.radiusKm === option.value}
              onClick={() => patch({ radiusKm: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Speed">
          <Chip pressed={filters.speed === "all"} onClick={() => patch({ speed: "all" })}>
            Any
          </Chip>
          {speeds.map((speed) => (
            <Chip
              key={speed}
              pressed={filters.speed === speed}
              onClick={() => patch({ speed })}
            >
              {speedLabel(speed)}
            </Chip>
          ))}
        </ChipRow>
        {connectors.length > 0 ? (
          <ChipRow label="Connector">
            <Chip
              pressed={!filters.connector}
              onClick={() => patch({ connector: null })}
            >
              Any
            </Chip>
            {connectors.map((type) => (
              <Chip
                key={type}
                pressed={filters.connector === type}
                onClick={() => patch({ connector: type })}
              >
                {type}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
        {networks.length > 0 ? (
          <ChipRow label="Network">
            <Chip pressed={!filters.network} onClick={() => patch({ network: null })}>
              Any
            </Chip>
            {networks.map(([key]) => (
              <Chip
                key={key}
                pressed={filters.network === key}
                onClick={() => patch({ network: key })}
              >
                {key === "unbranded" ? "Unbranded" : networkLabel(key)}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
        {provinces.length > 1 ? (
          <ChipRow label="Province">
            <Chip
              pressed={!filters.province}
              onClick={() => patch({ province: null, city: null })}
            >
              Any
            </Chip>
            {provinces.map((province) => (
              <Chip
                key={province}
                pressed={filters.province === province}
                onClick={() => patch({ province, city: null })}
              >
                {province}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
        {cities.length > 1 ? (
          <ChipRow label="City">
            <Chip pressed={!filters.city} onClick={() => patch({ city: null })}>
              Any
            </Chip>
            {cities.map(([city]) => (
              <Chip
                key={city}
                pressed={filters.city === city}
                onClick={() => patch({ city })}
              >
                {city}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>

      <p className="text-sm text-[var(--ink-muted)]" aria-live="polite">
        {results.length === 0
          ? `No stations ${radiusLabel} of ${origin.label} match these filters.`
          : `${results.length} station${results.length === 1 ? "" : "s"} ${radiusLabel} of ${origin.label}.`}
      </p>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-4">
          <StationMap
            stations={results}
            activeId={activeId}
            focus={focus}
            origin={origin}
            onSelect={(id) => {
              setFocus("map");
              setActiveId(id);
            }}
          />
          <p className="mt-2 text-xs text-[var(--ink-faint)]">
            Map tiles © OpenStreetMap contributors. Pinch or use + − to zoom.
          </p>
        </div>
        <div id="ev-results">
          {results.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <EmptySketch className="mx-auto h-16 w-24 text-[var(--ink-faint)]" />
              <p className="text-sm text-[var(--ink-muted)]">
                Try a wider distance or clear a filter.
              </p>
            </div>
          ) : (
            <div>
              {visible.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  active={station.id === activeId}
                  onSelect={() => {
                    setFocus("list");
                    setActiveId(station.id);
                  }}
                />
              ))}
              {visible.length < results.length ? (
                <button
                  type="button"
                  className="mt-4 text-sm text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--graphite)] hover:underline"
                  onClick={() => setLimit((value) => value + 20)}
                >
                  Show {Math.min(20, results.length - visible.length)} more
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <CuratedNote />
    </div>
  );
}
