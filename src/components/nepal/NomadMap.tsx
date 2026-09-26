"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
type LeafletNs = typeof import("leaflet");
import "leaflet/dist/leaflet.css";
import { mapTileOptions, readMapTheme } from "@/lib/map-style";

function mountTiles(leaflet: LeafletNs, map: LeafletMap): TileLayer {
  const spec = mapTileOptions(readMapTheme());
  return leaflet.tileLayer(spec.url, spec.options).addTo(map);
}

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
    let map: LeafletMap | null = null;
    let alive = true;
    let onTheme: (() => void) | null = null;

    (async () => {
      const leaflet = await import("leaflet");
      if (!alive || !holderRef.current) return;
      map = leaflet.map(holder, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });
      let tiles = mountTiles(leaflet, map);
      onTheme = () => {
        if (!map) return;
        map.removeLayer(tiles);
        tiles = mountTiles(leaflet, map);
        tiles.bringToBack();
      };
      window.addEventListener("nearby-theme", onTheme);
      map.attributionControl?.setPrefix("");
      const markers = pins.map((pin) => {
        const icon = leaflet.divIcon({
          className: "map-pin-wrap",
          html: '<span class="map-dot nomad-dot"></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        return leaflet
          .marker([pin.lat, pin.lng], { icon, title: pin.name, keyboard: true })
          .bindPopup(pin.name);
      });
      const group = leaflet.featureGroup(markers).addTo(map);
      if (pins.length === 1) {
        map.setView([pins[0].lat, pins[0].lng], 15);
      } else {
        map.fitBounds(group.getBounds().pad(0.25));
      }
      window.setTimeout(() => map?.invalidateSize(), 80);
    })();

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
