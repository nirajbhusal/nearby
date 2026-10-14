"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MlMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { NEPAL_BBOX } from "@/lib/nepal/bbox";
import { ensureMapWorker, mapStyleUrl, readMapTheme } from "@/lib/map-style";
import type { JobMapPin } from "@/lib/nepal/jobs";

type Scope = "nearby" | "all";

type Props = {
  pins: JobMapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  scope: Scope;
  onScope: (scope: Scope) => void;
};

type Drawn =
  | { kind: "pin"; pin: JobMapPin }
  | { kind: "cluster"; id: string; lat: number; lng: number; roleCount: number; pins: JobMapPin[] };

function clusterJobPins(pins: JobMapPin[], zoom: number): Drawn[] {
  if (zoom >= 10 || pins.length < 2) return pins.map((pin) => ({ kind: "pin", pin }));
  const divisor = zoom < 7 ? 3.4 : zoom < 8.6 ? 5.5 : 8;
  const cell = 360 / 2 ** zoom / divisor;
  const groups = new Map<string, JobMapPin[]>();
  for (const pin of pins) {
    const key = `${Math.floor(pin.lat / cell)}:${Math.floor(pin.lng / cell)}`;
    const list = groups.get(key);
    if (list) list.push(pin);
    else groups.set(key, [pin]);
  }
  const drawn: Drawn[] = [];
  for (const [id, group] of groups) {
    if (group.length === 1) {
      drawn.push({ kind: "pin", pin: group[0] });
      continue;
    }
    let lat = 0;
    let lng = 0;
    let roleCount = 0;
    for (const pin of group) {
      lat += pin.lat;
      lng += pin.lng;
      roleCount += pin.roleCount;
    }
    drawn.push({
      kind: "cluster",
      id,
      lat: lat / group.length,
      lng: lng / group.length,
      roleCount,
      pins: group,
    });
  }
  return drawn;
}

function fitView(map: MlMap, pins: JobMapPin[], scope: Scope) {
  if (scope === "all") {
    const [west, south, east, north] = NEPAL_BBOX;
    map.fitBounds(new LngLatBounds([west, south], [east, north]), {
      padding: 48,
      maxZoom: 6.5,
      duration: 0,
    });
    return;
  }
  const primary = pins[0];
  const close = pins.filter((pin) => {
    const dLat = pin.lat - primary.lat;
    const dLng = pin.lng - primary.lng;
    return dLat * dLat + dLng * dLng < 0.12;
  });
  if (close.length === 1) map.jumpTo({ center: [primary.lng, primary.lat], zoom: 12 });
  else {
    const bounds = new LngLatBounds();
    for (const pin of close) bounds.extend([pin.lng, pin.lat]);
    map.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 0 });
  }
}

export default function JobsMap({ pins, selectedId, onSelect, scope, onScope }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const pinsRef = useRef(pins);
  const scopeRef = useRef(scope);
  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selectedId;
    pinsRef.current = pins;
    scopeRef.current = scope;
    holderRef.current?.querySelectorAll<HTMLButtonElement>("button[data-pin]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.pin === selectedId);
    });
  });

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || pins.length === 0) return;
    let map: MlMap | null = null;
    let alive = true;
    let onTheme: (() => void) | null = null;
    const markers: Marker[] = [];

    ensureMapWorker();
    map = new MlMap({
      container: holder,
      style: mapStyleUrl(readMapTheme()),
      center: [pins[0].lng, pins[0].lat],
      zoom: scope === "all" ? 6 : 12,
      attributionControl: { compact: true },
      scrollZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    onTheme = () => {
      map?.setStyle(mapStyleUrl(readMapTheme()));
    };
    window.addEventListener("nearby-theme", onTheme);

    const draw = () => {
      if (!alive || !map) return;
      for (const marker of markers) marker.remove();
      markers.length = 0;
      const zoom = map.getZoom();
      for (const item of clusterJobPins(pinsRef.current, zoom)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "map-pin-wrap";
        if (item.kind === "cluster") {
          const size = item.pins.length >= 12 ? "xl" : item.pins.length >= 6 ? "lg" : "md";
          const places = `${item.pins.length} places`;
          const roles = `${item.roleCount} open role${item.roleCount === 1 ? "" : "s"}`;
          button.title = `${places}. ${roles}. Zoom in`;
          button.setAttribute("aria-label", `${places}, ${roles}. Zoom in`);
          button.innerHTML = `<span class="map-cluster size-${size}">${item.pins.length}</span>`;
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!map) return;
            const bounds = new LngLatBounds();
            for (const pin of item.pins) bounds.extend([pin.lng, pin.lat]);
            const span = Math.max(
              Math.abs(bounds.getEast() - bounds.getWest()),
              Math.abs(bounds.getNorth() - bounds.getSouth()),
            );
            if (span < 0.01) {
              map.flyTo({
                center: [item.lng, item.lat],
                zoom: Math.min(map.getZoom() + 2.2, 13),
                duration: 450,
              });
              return;
            }
            map.fitBounds(bounds, { padding: 72, maxZoom: 13, duration: 450 });
          });
          markers.push(new Marker({ element: button, anchor: "center" }).setLngLat([item.lng, item.lat]).addTo(map));
          continue;
        }
        const pin = item.pin;
        button.dataset.pin = pin.id;
        if (pin.id === selectedRef.current) button.classList.add("is-selected");
        const roles = `${pin.roleCount} open role${pin.roleCount === 1 ? "" : "s"}`;
        button.title = `${pin.label}. ${roles}`;
        button.setAttribute("aria-label", `${pin.label}. ${roles}`);
        const halo = pin.kind === "area" ? `<span class="pin-ring" aria-hidden="true"></span>` : "";
        button.innerHTML = `${halo}<span class="map-cluster job-pin">${pin.roleCount}</span>`;
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(pin.id);
        });
        markers.push(new Marker({ element: button, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(map));
      }
    };

    map.on("load", () => {
      if (!alive || !map) return;
      fitView(map, pinsRef.current, scopeRef.current);
      draw();
      map.resize();
      const collapseAttrib = () => {
        map?.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      };
      collapseAttrib();
      map.once("idle", collapseAttrib);
    });
    map.on("zoomend", draw);

    return () => {
      alive = false;
      if (onTheme) window.removeEventListener("nearby-theme", onTheme);
      map?.remove();
    };
  }, [pins, scope]);

  return (
    <div className="jobs-map-frame">
      <div
        ref={holderRef}
        className="jobs-map"
        role="region"
        aria-label={selectedId ? "Company offices, one selected" : "Company offices"}
      />
      <div className="map-scope" role="group" aria-label="Map area">
        <button type="button" aria-pressed={scope === "nearby"} onClick={() => onScope("nearby")}>
          Nearby
        </button>
        <button type="button" aria-pressed={scope === "all"} onClick={() => onScope("all")}>
          All
        </button>
      </div>
      <details className="map-info">
        <summary aria-label="How office pins are placed">i</summary>
        <p>
          A plain pin is a building or a street. A ring means the office is only placed in that area. One pin per city
          groups offices still at the city centre, so that location is approximate. Nearby stays close to this place.
          All shows the whole country, and a numbered bubble zooms in when you tap it.
        </p>
      </details>
    </div>
  );
}
