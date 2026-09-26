"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MlMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ensureMapWorker, mapStyleUrl, readMapTheme } from "@/lib/map-style";
import type { JobMapPin } from "@/lib/nepal/jobs";

type Props = {
  pins: JobMapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function JobsMap({ pins, selectedId, onSelect }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selectedId;
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
      zoom: 11,
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
      if (!map) return;
      for (const marker of markers) marker.remove();
      markers.length = 0;
      for (const pin of pins) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "map-pin-wrap";
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
      draw();
      const primary = pins[0];
      const close = pins.filter((pin) => {
        const dLat = pin.lat - primary.lat;
        const dLng = pin.lng - primary.lng;
        return dLat * dLat + dLng * dLng < 0.12;
      });
      if (close.length === 1) map.jumpTo({ center: [primary.lng, primary.lat], zoom: 11 });
      else {
        const bounds = new LngLatBounds();
        for (const pin of close) bounds.extend([pin.lng, pin.lat]);
        map.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 0 });
      }
      map.resize();
      const collapseAttrib = () => {
        map?.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      };
      collapseAttrib();
      map.once("idle", collapseAttrib);
    });

    return () => {
      alive = false;
      if (onTheme) window.removeEventListener("nearby-theme", onTheme);
      map?.remove();
    };
  }, [pins]);

  return (
    <div className="jobs-map-frame">
      <div
        ref={holderRef}
        className="jobs-map"
        role="region"
        aria-label={selectedId ? "Company offices, one selected" : "Company offices"}
      />
      <details className="map-info">
        <summary aria-label="How office pins are placed">i</summary>
        <p>
          A plain pin is a building or a street. A ring means the office is only placed in that area. One pin per city
          groups offices still at the city centre, so that location is approximate.
        </p>
      </details>
    </div>
  );
}
