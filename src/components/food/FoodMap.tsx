"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { spiderLatLng, stackKey } from "@/components/charge/cluster";
import { Peek } from "@/components/peek/Peek";
import { ensureMapWorker, mapStyleUrl, readMapTheme } from "@/lib/map-style";
import type { FoodSpot } from "@/lib/nepal/food";

export type FoodFrame =
  | { mode: "bounds"; bbox: [number, number, number, number]; maxZoom?: number }
  | { mode: "point"; lng: number; lat: number; zoom: number };

type Props = {
  spots: FoodSpot[];
  origin: { lat: number; lng: number };
  frame: FoodFrame;
  selectedId: string | null;
  showYou: boolean;
  scope: "nearby" | "all";
  onScope: (scope: "nearby" | "all") => void;
  onSelect: (id: string) => void;
  onLocate: () => void;
};

const CUP =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M6 8h9v3.2a4.2 4.2 0 0 1-4.2 4.2H10A4 4 0 0 1 6 11.4V8zM15 9.2h2.2A2.4 2.4 0 0 1 17 14M7 19h8"/></svg>';

function frameKey(frame: FoodFrame): string {
  if (frame.mode === "bounds") return `b:${frame.bbox.join(",")}:${frame.maxZoom ?? ""}`;
  return `p:${frame.lng.toFixed(4)},${frame.lat.toFixed(4)},${frame.zoom}`;
}

function framePadding(map: MlMap) {
  const canvas = map.getContainer().getBoundingClientRect();
  const panel = document.querySelector(".charge-panel");
  const desktop = window.innerWidth >= 1024;
  if (desktop && panel instanceof HTMLElement) {
    const rect = panel.getBoundingClientRect();
    return { top: 56, right: 72, bottom: 36, left: Math.max(24, rect.right - canvas.left + 24) };
  }
  let bottom = 280;
  if (panel instanceof HTMLElement) {
    const rect = panel.getBoundingClientRect();
    bottom = Math.max(160, canvas.bottom - rect.top + 16);
  }
  return { top: 16, right: 64, bottom, left: 16 };
}

function applyFrame(map: MlMap, frame: FoodFrame) {
  map.resize();
  if (frame.mode === "bounds") {
    const [west, south, east, north] = frame.bbox;
    map.fitBounds(new LngLatBounds([west, south], [east, north]), {
      padding: framePadding(map),
      duration: 0,
      maxZoom: frame.maxZoom ?? 14,
    });
    return;
  }
  map.jumpTo({ center: [frame.lng, frame.lat], zoom: frame.zoom });
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

type Pin =
  | { kind: "spot"; spot: FoodSpot }
  | { kind: "cluster"; lat: number; lng: number; spots: FoodSpot[] };

function clusterSpots(spots: FoodSpot[], zoom: number): Pin[] {
  if (zoom >= 13 || spots.length < 2) return spots.map((spot) => ({ kind: "spot", spot }));
  const cell = 360 / 2 ** zoom / (zoom < 11 ? 8 : 12);
  const groups = new Map<string, FoodSpot[]>();
  for (const spot of spots) {
    const key = `${Math.floor(spot.lat / cell)}:${Math.floor(spot.lng / cell)}`;
    const list = groups.get(key);
    if (list) list.push(spot);
    else groups.set(key, [spot]);
  }
  const pins: Pin[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      pins.push({ kind: "spot", spot: group[0] });
      continue;
    }
    const lat = group.reduce((sum, spot) => sum + spot.lat, 0) / group.length;
    const lng = group.reduce((sum, spot) => sum + spot.lng, 0) / group.length;
    pins.push({ kind: "cluster", lat, lng, spots: group });
  }
  return pins;
}

function LocateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function FoodMap({ spots, origin, frame, selectedId, showYou, scope, onScope, onSelect, onLocate }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const spotsRef = useRef(spots);
  const frameRef = useRef(frame);
  const selectedRef = useRef(selectedId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    spotsRef.current = spots;
    frameRef.current = frame;
    selectedRef.current = selectedId;
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
            center: [(initial.bbox[0] + initial.bbox[2]) / 2, (initial.bbox[1] + initial.bbox[3]) / 2] as [number, number],
            zoom: 12,
          };
    map = new MlMap({
      container: holder,
      style: mapStyleUrl(theme),
      center: start.center,
      zoom: start.zoom,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.once("load", () => {
      if (!alive || !map) return;
      applyFrame(map, frameRef.current);
      mapRef.current = map;
      setReady(true);
      map.resize();
    });
    onTheme = () => map?.setStyle(mapStyleUrl(readMapTheme()));
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
  }, []);

  const key = frameKey(frame);
  useEffect(() => {
    if (!ready || selectedId) return;
    const map = mapRef.current;
    if (!map) return;
    applyFrame(map, frame);
  }, [ready, key, selectedId, frame]);

  useEffect(() => {
    if (!ready || !selectedId) return;
    const spot = spots.find((item) => item.id === selectedId);
    const map = mapRef.current;
    if (!spot || !map) return;
    map.flyTo({ center: [spot.lng, spot.lat], zoom: Math.max(map.getZoom(), 15), duration: 450 });
  }, [ready, selectedId, spots]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    const markers: Marker[] = [];
    const draw = () => {
      for (const marker of markers) marker.remove();
      markers.length = 0;
      const zoom = map.getZoom();
      const pins = clusterSpots(spotsRef.current, zoom);
      const stacks = new Map<string, FoodSpot[]>();
      for (const spot of spotsRef.current) {
        const stack = stackKey(spot);
        const list = stacks.get(stack);
        if (list) list.push(spot);
        else stacks.set(stack, [spot]);
      }
      for (const pin of pins) {
        if (pin.kind === "cluster") {
          const element = pinButton(`<span class="ev-cluster">${pin.spots.length}</span>`, `${pin.spots.length} places`);
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            const bounds = new LngLatBounds();
            for (const spot of pin.spots) bounds.extend([spot.lng, spot.lat]);
            map.fitBounds(bounds, { padding: 72, maxZoom: 15, duration: 450 });
          });
          markers.push(new Marker({ element, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(map));
          continue;
        }
        const spot = pin.spot;
        const active = spot.id === selectedRef.current;
        const stack = stacks.get(stackKey(spot)) ?? [spot];
        const index = Math.max(0, stack.findIndex((item) => item.id === spot.id));
        const metersPerPixel = (156543.03 * Math.cos((spot.lat * Math.PI) / 180)) / 2 ** zoom;
        const point = spiderLatLng(spot.lat, spot.lng, index, stack.length, 14 * metersPerPixel);
        const element = pinButton(
          `<span class="food-pin${active ? " is-active" : ""}">${CUP}</span>`,
          spot.name,
        );
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(spot.id);
        });
        const marker = new Marker({ element, anchor: "center" }).setLngLat([point.lng, point.lat]).addTo(map);
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
  }, [ready, spots, selectedId]);

  useEffect(() => {
    if (!ready || !showYou) return;
    const map = mapRef.current;
    if (!map) return;
    const element = document.createElement("div");
    element.className = "map-pin-wrap";
    element.innerHTML = '<span class="you-pin"></span>';
    element.setAttribute("aria-hidden", "true");
    const marker = new Marker({ element, anchor: "center" }).setLngLat([origin.lng, origin.lat]).addTo(map);
    marker.getElement().style.pointerEvents = "none";
    return () => {
      marker.remove();
    };
  }, [ready, showYou, origin.lat, origin.lng]);

  return (
    <div className="charge-map">
      <div ref={holderRef} className="charge-map-canvas" />
      <div className="map-scope" role="group" aria-label="Map area">
        <button type="button" aria-pressed={scope === "nearby"} onClick={() => onScope("nearby")}>
          Nearby
        </button>
        <button type="button" aria-pressed={scope === "all"} onClick={() => onScope("all")}>
          All
        </button>
      </div>
      <div className="map-stack">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
        <button type="button" aria-label="Places near me" onClick={onLocate}>
          <LocateIcon />
        </button>
      </div>
      {ready ? null : (
        <div className="map-skeleton peek-stage" role="status" aria-label="Loading map">
          <Peek size={64} state="looking" />
        </div>
      )}
    </div>
  );
}
