"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import { DirectionsLink } from "@/components/nepal/NavigateLinks";
import { SwipeHint, SwipeRow } from "@/components/motion/SwipeRow";
import { FitMark } from "@/components/SaveButton";
import { chargeHref } from "@/lib/item-link";
import { formatDistance, type DistanceUnit } from "@/lib/local-profile";
import {
  connectorLine,
  isApproximate,
  networkLabel,
  networkMonogram,
  stationArea,
  type NearbyStation,
  type StationSort,
} from "@/lib/nepal/ev";
import { directionQuery } from "@/lib/nepal/networks";

const OVERSCAN = 8;
const ROW_PAD = 28;
const TITLE_LINE = 22;
const META_LINE = 18;
const PLUG_LINE = 24;

/** Copy column after the monogram, directions button, and chevron. */
function copyWidth(listWidth: number): number {
  return Math.max(96, listWidth - 16 - 40 - 12 - 84);
}

function rowHeight(station: NearbyStation, width: number): number {
  const copy = copyWidth(width);
  const titleLines = Math.min(2, Math.max(1, Math.ceil((station.name.length * 9.1) / copy)));
  const fast = station.speed === "fast" ? 46 : 0;
  let plugLines = 1;
  if (isApproximate(station)) {
    plugLines = 148 + fast > copy ? 2 : 1;
  } else {
    const parts = connectorLine(station).split(" · ").filter(Boolean);
    const widths = (parts.length ? parts : ["Connectors not listed"]).map((part) => part.length * 7.2 + 18);
    if (fast) widths.push(fast);
    let line = 0;
    let lines = 1;
    for (const item of widths) {
      if (line > 0 && line + 6 + item > copy) {
        lines += 1;
        line = item;
      } else {
        line = line === 0 ? item : line + 6 + item;
      }
    }
    plugLines = Math.min(2, lines);
  }
  const plugs = plugLines * PLUG_LINE + (plugLines - 1) * 6;
  return Math.max(76, ROW_PAD + titleLines * TITLE_LINE + 4 + META_LINE + plugs);
}

export function SortControl({
  value,
  onChange,
}: {
  value: StationSort;
  onChange: (sort: StationSort) => void;
}) {
  const options: { id: StationSort; label: string }[] = [
    { id: "nearest", label: "Nearest" },
    { id: "fastest", label: "Fastest" },
    { id: "az", label: "A–Z" },
  ];
  return (
    <div className="sort-seg" role="group" aria-label="Sort">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          className={value === option.id ? "is-on" : undefined}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StationList({
  stations,
  showDistance,
  unit,
  selectedId,
  fits,
  onSelect,
  onHover,
}: {
  stations: NearbyStation[];
  showDistance: boolean;
  unit: DistanceUnit;
  selectedId: string | null;
  fits: (station: NearbyStation) => boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const hostRef = useRef<HTMLUListElement>(null);
  const [listWidth, setListWidth] = useState(360);
  const [range, setRange] = useState({ start: 0, end: 24 });
  const layout = useRef({ offsets: [] as number[], heights: [] as number[], total: 0 });
  const nextHeights = stations.map((station) => rowHeight(station, listWidth));
  const nextOffsets = new Array<number>(stations.length);
  let total = 0;
  for (let index = 0; index < stations.length; index += 1) {
    nextOffsets[index] = total;
    total += nextHeights[index];
  }
  layout.current = { offsets: nextOffsets, heights: nextHeights, total };

  useEffect(() => {
    const host = hostRef.current;
    const scroller = host?.closest(".sheet-body, .charge-list-page") as HTMLElement | null;
    if (!host || !scroller) return;
    const update = () => {
      const width = host.clientWidth || 360;
      setListWidth((prev) => (prev === width ? prev : width));
      const { offsets: tops, heights: rows } = layout.current;
      const hostTop =
        host.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      const viewTop = scroller.scrollTop - hostTop;
      const start = Math.max(0, indexAt(tops, rows, viewTop - 76 * OVERSCAN));
      const end = Math.min(stations.length, indexAt(tops, rows, viewTop + scroller.clientHeight + 76 * OVERSCAN) + 1);
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(host);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [stations.length, listWidth]);

  return (
    <>
    <SwipeHint />
    <ul
      ref={hostRef}
      className="station-list"
      style={{ height: layout.current.total }}
      onPointerLeave={() => onHover(null)}
    >
      {stations.slice(range.start, range.end).map((station, index) => {
        const at = range.start + index;
        return (
          <StationRow
            key={station.id}
            station={station}
            top={layout.current.offsets[at] ?? 0}
            height={layout.current.heights[at] ?? 76}
            last={at === stations.length - 1}
            showDistance={showDistance}
            unit={unit}
            selected={station.id === selectedId}
            fits={fits(station)}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </ul>
    </>
  );
}

function indexAt(offsets: number[], heights: number[], y: number): number {
  if (offsets.length === 0) return 0;
  let lo = 0;
  let hi = offsets.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] + heights[mid] <= y) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function StationRow({
  station,
  top,
  height,
  last,
  showDistance,
  unit,
  selected,
  fits,
  onSelect,
  onHover,
}: {
  station: NearbyStation;
  top: number;
  height: number;
  last: boolean;
  showDistance: boolean;
  unit: DistanceUnit;
  selected: boolean;
  fits: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const mono = networkMonogram(station.network_id || station.network);
  const plugs = connectorLine(station)
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  const approx = isApproximate(station);
  const meta = [
    stationArea(station),
    showDistance ? formatDistance(station.distanceKm, unit) : "",
    networkLabel(station.network),
  ].filter(Boolean);
  const saved = {
    id: station.id,
    kind: "charger" as const,
    title: station.name,
    subtitle: station.city ?? "",
    href: chargeHref(station.id),
  };
  return (
    <li
      className={`station-line${selected ? " is-selected" : ""}${last ? " is-last" : ""}`}
      data-station={station.id}
      style={{ top, height }}
    >
      <SwipeRow item={saved} share={{ title: station.name, text: station.name, url: chargeHref(station.id) }}>
        <div
          className="station-row"
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            onHover(station.id);
          }}
        >
          <button type="button" className="station-open" onClick={() => onSelect(station.id)}>
            <span className="net-icon" aria-hidden="true">
              <Zap size={mono ? 14 : 18} strokeWidth={1.75} />
              {mono ? <span className="mono">{mono}</span> : null}
            </span>
            <span className="station-copy">
              <span className="station-name">
                {station.name}
                {fits ? <FitMark /> : null}
              </span>
              <span className="station-meta">{meta.join(" · ")}</span>
              <span className="station-plugs">
                {approx ? (
                  <span className="approx-pill">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2 1.5" />
                    </svg>
                    Approx. location
                  </span>
                ) : plugs.length > 0 ? (
                  plugs.map((plug) => (
                    <span className="plug-pill" key={plug}>
                      {plug}
                    </span>
                  ))
                ) : (
                  <span className="plug-pill">Connectors not listed</span>
                )}
                {station.speed === "fast" ? <span className="fast-tag">Fast</span> : null}
              </span>
            </span>
            <ChevronRight className="station-chevron" size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <DirectionsLink
            lat={station.lat}
            lng={station.lng}
            name={station.name}
            compact
            search={approx ? directionQuery(station) : null}
          />
        </div>
      </SwipeRow>
    </li>
  );
}
