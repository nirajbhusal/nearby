"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MlMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { pinHint, type NearbyStation } from "@/lib/nepal/ev";
import { clusterStations } from "@/components/charge/cluster";
import { mapStyleUrl, readMapTheme } from "@/lib/map-style";

type Props = {
  stations: NearbyStation[];
  origin: { lat: number; lng: number };
  selectedId: string | null;
  showYou: boolean;
  onSelect: (id: string) => void;
};

function speedClass(speed: string): string {
  if (speed === "fast" || speed === "slow") return speed;
  return "unknown";
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
  selectedId,
  showYou,
  onSelect,
}: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const stationsRef = useRef(stations);
  const selectedRef = useRef(selectedId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    stationsRef.current = stations;
    selectedRef.current = selectedId;
  });

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let map: MlMap | null = null;
    let alive = true;
    let onTheme: (() => void) | null = null;

    const theme = readMapTheme();
    map = new MlMap({
      container: holder,
      style: mapStyleUrl(theme),
      center: [origin.lng, origin.lat],
      zoom: 13,
      minZoom: 6,
      maxZoom: 18,
      attributionControl: { compact: false },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.once("load", () => {
      if (!alive) return;
      mapRef.current = map;
      setReady(true);
      map?.resize();
    });
    onTheme = () => {
      const next = readMapTheme();
      map?.setStyle(mapStyleUrl(next));
    };
    window.addEventListener("nearby-theme", onTheme);

    const onResize = () => map?.resize();
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

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map || selectedRef.current) return;
    map.flyTo({ center: [origin.lng, origin.lat], zoom: 13, duration: 450 });
  }, [origin.lat, origin.lng, ready]);

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
      for (const pin of clusterStations(stations, zoom)) {
        if (pin.kind === "cluster") {
          const hot = pin.fast >= pin.count / 2 && pin.fast > 0;
          const element = pinButton(
            `<span class="map-cluster${hot ? " is-fast" : ""}">${pin.count}</span>`,
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
        const hint = zoom >= 14 ? pinHint(station) : "";
        const element = pinButton(
          `<span class="map-pin-row${active ? " is-active" : ""}"><span class="map-dot speed-${speedClass(station.speed)}"></span>${
            hint ? `<span class="map-pin-kw">${hint}</span>` : ""
          }</span>`,
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
  }, [ready, stations, selectedId]);

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
      {ready ? null : <div className="map-skeleton" role="status" aria-label="Loading map" />}
    </div>
  );
}
