"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { NearbyStation } from "@/lib/nepal/ev";
import { clusterStations } from "@/components/charge/cluster";
import { ensureMapWorker, mapStyleUrl, readMapTheme } from "@/lib/map-style";

export type MapFrame =
  | { mode: "bounds"; bbox: [number, number, number, number] }
  | { mode: "point"; lng: number; lat: number; zoom: number };

export type ProvinceBubble = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
};

type Props = {
  stations: NearbyStation[];
  origin: { lat: number; lng: number };
  frame: MapFrame;
  selectedId: string | null;
  showYou: boolean;
  provinces: ProvinceBubble[] | null;
  onSelect: (id: string) => void;
  onProvince: (slug: string) => void;
  onLocate: () => void;
};

function frameKey(frame: MapFrame): string {
  if (frame.mode === "bounds") return `b:${frame.bbox.join(",")}`;
  return `p:${frame.lng.toFixed(4)},${frame.lat.toFixed(4)},${frame.zoom}`;
}

function framePadding(map: MlMap) {
  const canvas = map.getContainer().getBoundingClientRect();
  const panel = document.querySelector(".charge-panel");
  const desktop = window.innerWidth >= 1024;
  if (desktop && panel instanceof HTMLElement) {
    const rect = panel.getBoundingClientRect();
    const left = Math.max(24, rect.right - canvas.left + 24);
    return { top: 56, right: 72, bottom: 36, left };
  }
  let bottom = 240;
  if (panel instanceof HTMLElement) {
    const rect = panel.getBoundingClientRect();
    bottom = Math.max(120, canvas.bottom - rect.top + 16);
  }
  return { top: 16, right: 64, bottom, left: 16 };
}

function applyFrame(map: MlMap, frame: MapFrame) {
  map.resize();
  if (frame.mode === "bounds") {
    const [west, south, east, north] = frame.bbox;
    const country = east - west > 6;
    map.fitBounds(new LngLatBounds([west, south], [east, north]), {
      padding: framePadding(map),
      duration: 0,
      maxZoom: country ? 6.8 : 11,
    });
    return;
  }
  map.jumpTo({ center: [frame.lng, frame.lat], zoom: frame.zoom });
}

const BOLT =
  '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M13.2 2.2 4.4 13.4h6.2l-.8 8.4 9.8-12.2h-6.6l.2-7.4z"/></svg>';

function speedClass(speed: string): string {
  if (speed === "fast" || speed === "slow") return speed;
  return "unknown";
}

function bubbleSize(count: number): number {
  return Math.round(36 + Math.sqrt(count) * 2.2);
}

function LocateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function pinButton(html: string, label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-pin-wrap";
  button.innerHTML = html;
  button.title = label;
  button.setAttribute("aria-label", label);
  return button;
}

export default function ChargeMap({
  stations,
  origin,
  frame,
  selectedId,
  showYou,
  provinces,
  onSelect,
  onProvince,
  onLocate,
}: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const onProvinceRef = useRef(onProvince);
  const stationsRef = useRef(stations);
  const provincesRef = useRef(provinces);
  const selectedRef = useRef(selectedId);
  const frameRef = useRef(frame);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onProvinceRef.current = onProvince;
    stationsRef.current = stations;
    provincesRef.current = provinces;
    selectedRef.current = selectedId;
    frameRef.current = frame;
  });

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let map: MlMap | null = null;
    let alive = true;
    let onTheme: (() => void) | null = null;

    ensureMapWorker();
    const theme = readMapTheme();
    const initial = frameRef.current;
    const start =
      initial.mode === "point"
        ? { center: [initial.lng, initial.lat] as [number, number], zoom: initial.zoom }
        : {
            center: [(initial.bbox[0] + initial.bbox[2]) / 2, (initial.bbox[1] + initial.bbox[3]) / 2] as [
              number,
              number,
            ],
            zoom: 5,
          };
    map = new MlMap({
      container: holder,
      style: mapStyleUrl(theme),
      center: start.center,
      zoom: start.zoom,
      minZoom: 4.5,
      maxZoom: 18,
      attributionControl: {
        compact: true,
        customAttribution: "Boundary © Survey Department of Nepal, official map 2020",
      },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.once("load", () => {
      if (!alive || !map) return;
      applyFrame(map, frameRef.current);
      requestAnimationFrame(() => {
        if (alive && map && !selectedRef.current) applyFrame(map, frameRef.current);
      });
      const collapseAttrib = () => {
        map?.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      };
      collapseAttrib();
      map.once("idle", collapseAttrib);
      mapRef.current = map;
      setReady(true);
      map.resize();
    });
    onTheme = () => {
      const next = readMapTheme();
      map?.setStyle(mapStyleUrl(next));
    };
    window.addEventListener("nearby-theme", onTheme);

    const onResize = () => {
      if (!map) return;
      map.resize();
      if (!selectedRef.current) applyFrame(map, frameRef.current);
    };
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(() => map?.resize());
    observer.observe(holder);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      if (onTheme) window.removeEventListener("nearby-theme", onTheme);
      observer.disconnect();
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // Map is created once. Origin updates fly in a later effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = frameKey(frame);
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map || selectedId) return;
    applyFrame(map, frame);
    // key is the stable identity of frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, selectedId]);

  useEffect(() => {
    if (!ready || !selectedId) return;
    const station = stationsRef.current.find((item) => item.id === selectedId);
    const map = mapRef.current;
    if (!station || !map) return;
    map.flyTo({
      center: [station.lng, station.lat],
      zoom: Math.max(map.getZoom(), 15),
      duration: 450,
    });
  }, [selectedId, ready]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    const markers: Marker[] = [];

    const draw = () => {
      for (const marker of markers) marker.remove();
      markers.length = 0;
      const zoom = map.getZoom();
      const bubbles = provincesRef.current;
      if (bubbles && bubbles.length > 0 && zoom < 8) {
        for (const province of bubbles) {
          const size = bubbleSize(province.count);
          const element = pinButton(
            `<span class="province-bubble" style="width:${size}px;height:${size}px">${province.count}</span>`,
            `${province.name}, ${province.count} chargers`,
          );
          element.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onProvinceRef.current(province.slug);
          });
          markers.push(
            new Marker({ element, anchor: "center" }).setLngLat([province.lng, province.lat]).addTo(map),
          );
        }
        return;
      }
      for (const pin of clusterStations(stations, zoom)) {
        if (pin.kind === "cluster") {
          const size = pin.count >= 40 ? "xl" : pin.count >= 12 ? "lg" : "md";
          const element = pinButton(
            `<span class="ev-cluster size-${size}">${pin.count}</span>`,
            `${pin.count} chargers`,
          );
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            map.flyTo({
              center: [pin.lng, pin.lat],
              zoom: Math.min(map.getZoom() + 2, 16),
              duration: 450,
            });
          });
          markers.push(
            new Marker({ element, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(map),
          );
          continue;
        }
        const station = pin.station;
        const active = station.id === selectedId;
        const element = pinButton(
          `<span class="ev-pin-row${active ? " is-active" : ""}"><span class="ev-pin speed-${speedClass(station.speed)}">${BOLT}</span></span>`,
          station.name,
        );
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(station.id);
        });
        const marker = new Marker({ element, anchor: "center" })
          .setLngLat([station.lng, station.lat])
          .addTo(map);
        if (active) marker.getElement().style.zIndex = "5";
        markers.push(marker);
      }
    };

    draw();
    map.on("zoomend", draw);
    return () => {
      map.off("zoomend", draw);
      for (const marker of markers) marker.remove();
    };
  }, [ready, stations, selectedId, provinces]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map || !showYou) return;
    const element = document.createElement("div");
    element.className = "map-pin-wrap";
    element.innerHTML = '<span class="you-pin"></span>';
    element.title = "You are here";
    element.setAttribute("aria-hidden", "true");
    const marker = new Marker({ element, anchor: "center" })
      .setLngLat([origin.lng, origin.lat])
      .addTo(map);
    marker.getElement().style.pointerEvents = "none";
    marker.getElement().style.zIndex = "4";
    return () => {
      marker.remove();
    };
  }, [ready, showYou, origin.lat, origin.lng]);

  return (
    <div className="charge-map">
      <div ref={holderRef} className="charge-map-canvas" />
      <div className="map-stack">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
        <button type="button" aria-label="Chargers near me" onClick={onLocate}>
          <LocateIcon />
        </button>
      </div>
      {ready ? null : <div className="map-skeleton" role="status" aria-label="Loading map" />}
    </div>
  );
}
