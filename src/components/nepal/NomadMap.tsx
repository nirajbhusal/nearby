"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MlMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapStyleUrl, readMapTheme } from "@/lib/map-style";

export type NomadPin = {
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  pins: NomadPin[];
};

export default function NomadMap({ pins }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || pins.length === 0) return;
    let map: MlMap | null = null;
    let alive = true;
    let onTheme: (() => void) | null = null;

    const first = pins[0];
    map = new MlMap({
      container: holder,
      style: mapStyleUrl(readMapTheme()),
      center: [first.lng, first.lat],
      zoom: pins.length === 1 ? 15 : 12,
      attributionControl: { compact: true },
      scrollZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-left");
    onTheme = () => {
      map?.setStyle(mapStyleUrl(readMapTheme()));
    };
    window.addEventListener("nearby-theme", onTheme);

    map.on("load", () => {
      if (!alive || !map) return;
      for (const pin of pins) {
        const element = document.createElement("div");
        element.className = "map-pin-wrap";
        element.innerHTML = '<span class="map-dot nomad-dot"></span>';
        element.title = pin.name;
        new Marker({ element, anchor: "center" })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(new Popup({ offset: 12, closeButton: false }).setText(pin.name))
          .addTo(map);
      }
      if (pins.length === 1) {
        map.jumpTo({ center: [pins[0].lng, pins[0].lat], zoom: 15 });
      } else {
        const bounds = new LngLatBounds();
        for (const pin of pins) bounds.extend([pin.lng, pin.lat]);
        map.fitBounds(bounds, { padding: 36, maxZoom: 15, duration: 0 });
      }
      map.resize();
    });

    return () => {
      alive = false;
      if (onTheme) window.removeEventListener("nearby-theme", onTheme);
      map?.remove();
    };
  }, [pins]);

  return (
    <div
      ref={holderRef}
      className="nomad-map"
      role="region"
      aria-label="Coworking spaces with a published coordinate"
    />
  );
}
