"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import { DirectionsLink } from "@/components/nepal/NavigateLinks";
import { SwipeRow } from "@/components/motion/SwipeRow";
import { FitMark } from "@/components/SaveButton";
import { chargeHref } from "@/lib/item-link";
import { formatDistance, type DistanceUnit } from "@/lib/local-profile";
import {
  connectorLine,
  networkLabel,
  networkMonogram,
  stationArea,
  type NearbyStation,
  type StationSort,
} from "@/lib/nepal/ev";

const ROW = 68;
const OVERSCAN = 8;

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
  const [range, setRange] = useState({ start: 0, end: 24 });

  useEffect(() => {
    const host = hostRef.current;
    const scroller = host?.closest(".sheet-body, .charge-list-page") as HTMLElement | null;
    if (!host || !scroller) return;
    const update = () => {
      const hostTop =
        host.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      const start = Math.max(0, Math.floor((scroller.scrollTop - hostTop) / ROW) - OVERSCAN);
      const end = Math.min(stations.length, start + Math.ceil(scroller.clientHeight / ROW) + OVERSCAN * 2);
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [stations.length]);

  return (
    <ul
      ref={hostRef}
      className="station-list"
      style={{ height: stations.length * ROW }}
      onPointerLeave={() => onHover(null)}
    >
      {stations.slice(range.start, range.end).map((station, index) => (
        <StationRow
          key={station.id}
          station={station}
          top={(range.start + index) * ROW}
          showDistance={showDistance}
          unit={unit}
          selected={station.id === selectedId}
          fits={fits(station)}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </ul>
  );
}

function StationRow({
  station,
  top,
  showDistance,
  unit,
  selected,
  fits,
  onSelect,
  onHover,
}: {
  station: NearbyStation;
  top: number;
  showDistance: boolean;
  unit: DistanceUnit;
  selected: boolean;
  fits: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const mono = networkMonogram(station.network);
  const plugs = connectorLine(station);
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
      className={selected ? "station-line is-selected" : "station-line"}
      data-station={station.id}
      style={{ top }}
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
                <span className="plug-text">{plugs || "Connectors not listed"}</span>
                {station.speed === "fast" ? <span className="fast-tag">Fast</span> : null}
              </span>
            </span>
            <ChevronRight className="station-chevron" size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <DirectionsLink lat={station.lat} lng={station.lng} name={station.name} compact />
        </div>
      </SwipeRow>
    </li>
  );
}
