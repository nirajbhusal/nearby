"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BASE_PATH } from "@/lib/base-path";
import { escapeHtml, formatKm, speedLabel } from "@/lib/nepal/format";
import type { NearbyStation } from "@/lib/nepal/ev";

type Props = {
  stations: NearbyStation[];
  activeId: string | null;
  focus: "map" | "list" | null;
  origin: { lat: number; lng: number };
  onSelect: (id: string) => void;
};

function pinIcon(L: typeof import("leaflet"), active: boolean) {
  return L.divIcon({
    className: "ev-pin-wrap",
    html: `<span class="ev-pin${active ? " is-active" : ""}"></span>`,
    iconSize: active ? [22, 22] : [16, 16],
    iconAnchor: active ? [11, 11] : [8, 8],
    popupAnchor: [0, active ? -12 : -10],
  });
}

export default function StationMap({
  stations,
  activeId,
  focus,
  origin,
  onSelect,
}: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const activeRef = useRef(activeId);
  const focusRef = useRef(focus);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    activeRef.current = activeId;
    focusRef.current = focus;
  });

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let map: LeafletMap | null = null;
    let alive = true;

    (async () => {
      const leaflet = await import("leaflet");
      if (!alive) return;
      map = leaflet.map(holder, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);
      map.setView([origin.lat, origin.lng], 12);
      mapRef.current = map;
      setReady(true);
      window.setTimeout(() => map?.invalidateSize(), 60);
    })();

    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);
    const markers = markersRef.current;

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      map?.remove();
      mapRef.current = null;
      markers.clear();
      setReady(false);
    };
    // The map is created once for this holder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let alive = true;

    (async () => {
      const leaflet = await import("leaflet");
      if (!alive || mapRef.current !== map) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      const selected = activeRef.current;
      for (const station of stations) {
        const marker = leaflet.marker([station.lat, station.lng], {
          icon: pinIcon(leaflet, station.id === selected),
          keyboard: true,
          title: station.name,
          zIndexOffset: station.id === selected ? 800 : 0,
        });
        const brand = station.network || station.operator || "";
        marker.bindPopup(
          `<div class="ev-popup">
            <p class="ev-popup-title">${escapeHtml(station.name)}</p>
            <p>${escapeHtml(formatKm(station.distanceKm))}${brand ? ` · ${escapeHtml(brand)}` : ""} · ${escapeHtml(speedLabel(station.speed))}</p>
            <p><a href="${BASE_PATH}/ev/${encodeURIComponent(station.id)}/">Details</a>
            · <a href="https://www.google.com/maps/dir/?api=1&amp;destination=${station.lat},${station.lng}" target="_blank" rel="noopener noreferrer">Navigate</a></p>
          </div>`
        );
        marker.on("click", () => onSelectRef.current(station.id));
        marker.addTo(map);
        markersRef.current.set(station.id, marker);
      }

      if (stations.length === 0) {
        map.setView([origin.lat, origin.lng], 11);
        return;
      }
      if (stations.length === 1) {
        map.setView([stations[0].lat, stations[0].lng], 13);
      } else {
        map.fitBounds(
          leaflet.latLngBounds(
            stations.map((station) => [station.lat, station.lng] as [number, number])
          ),
          { padding: [28, 28], maxZoom: 13 }
        );
      }
      map.invalidateSize();
    })();

    return () => {
      alive = false;
    };
  }, [ready, stations, origin.lat, origin.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let alive = true;

    (async () => {
      const leaflet = await import("leaflet");
      if (!alive) return;
      markersRef.current.forEach((marker, id) => {
        marker.setIcon(pinIcon(leaflet, id === activeId));
        marker.setZIndexOffset(id === activeId ? 800 : 0);
      });
      if (focus !== "list" || !activeId) return;
      const marker = markersRef.current.get(activeId);
      if (!marker) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) map.panTo(marker.getLatLng());
      else map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.35 });
      marker.openPopup();
    })();

    return () => {
      alive = false;
    };
  }, [ready, activeId, focus]);

  return (
    <div className="sketch-card overflow-hidden">
      <div
        ref={holderRef}
        className="nepal-map"
        role="application"
        aria-label="Map of EV charging stations. OpenStreetMap contributors provide the tiles. The list has the same stations."
      />
    </div>
  );
}
