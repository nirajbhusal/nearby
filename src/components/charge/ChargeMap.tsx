"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { pinHint, type NearbyStation } from "@/lib/nepal/ev";
import { clusterStations } from "@/components/charge/cluster";
import { mapTileOptions, readMapTheme, type MapTheme } from "@/lib/map-style";

type LeafletNs = typeof import("leaflet");

type Props = {
  stations: NearbyStation[];
  origin: { lat: number; lng: number };
  selectedId: string | null;
  showYou: boolean;
  onSelect: (id: string) => void;
};

function addTiles(leaflet: LeafletNs, map: LeafletMap, theme: MapTheme) {
  const spec = mapTileOptions(theme);
  const layer = leaflet.tileLayer(spec.url, spec.options).addTo(map);
  return { layer, theme };
}

function speedClass(speed: string): string {
  if (speed === "fast" || speed === "slow") return speed;
  return "unknown";
}

export default function ChargeMap({
  stations,
  origin,
  selectedId,
  showYou,
  onSelect,
}: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const youRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletNs | null>(null);
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
    let map: LeafletMap | null = null;
    let alive = true;
    let onTheme: (() => void) | null = null;

    (async () => {
      const leaflet = await import("leaflet");
      if (!alive || !holderRef.current) return;
      leafletRef.current = leaflet;
      map = leaflet.map(holder, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 6,
        maxZoom: 18,
      });
      let tiles = addTiles(leaflet, map, readMapTheme());
      onTheme = () => {
        const next = readMapTheme();
        if (!map || tiles.theme === next) return;
        map.removeLayer(tiles.layer);
        tiles = addTiles(leaflet, map, next);
        tiles.layer.bringToBack();
      };
      window.addEventListener("nearby-theme", onTheme);
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl?.setPrefix("");
      map.setView([origin.lat, origin.lng], 13);
      layerRef.current = leaflet.layerGroup().addTo(map);
      youRef.current = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      window.setTimeout(() => map?.invalidateSize(), 80);
    })();

    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      if (onTheme) window.removeEventListener("nearby-theme", onTheme);
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
      youRef.current = null;
      setReady(false);
    };
    // Map is created once. Origin updates fly in a later effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map || selectedRef.current) return;
    map.flyTo([origin.lat, origin.lng], 13, { duration: 0.45 });
  }, [origin.lat, origin.lng, ready]);

  useEffect(() => {
    if (!ready || !selectedId) return;
    const station = stationsRef.current.find((item) => item.id === selectedId);
    const map = mapRef.current;
    if (!station || !map) return;
    map.flyTo([station.lat, station.lng], Math.max(map.getZoom(), 15), { duration: 0.45 });
  }, [selectedId, ready]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const layer = layerRef.current;
    const leaflet = leafletRef.current;
    if (!map || !layer || !leaflet) return;

    const draw = () => {
      layer.clearLayers();
      const zoom = map.getZoom();
      for (const pin of clusterStations(stations, zoom)) {
        if (pin.kind === "cluster") {
          const hot = pin.fast >= pin.count / 2 && pin.fast > 0;
          const icon = leaflet.divIcon({
            className: "map-pin-wrap",
            html: `<span class="map-cluster${hot ? " is-fast" : ""}">${pin.count}</span>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });
          const marker = leaflet.marker([pin.lat, pin.lng], {
            icon,
            keyboard: true,
            title: `${pin.count} chargers`,
          });
          marker.on("click", () => {
            map.flyTo([pin.lat, pin.lng], Math.min(map.getZoom() + 2, 16));
          });
          marker.addTo(layer);
          continue;
        }
        const station = pin.station;
        const active = station.id === selectedId;
        const hint = zoom >= 14 ? pinHint(station) : "";
        const width = hint ? 58 : active ? 22 : 18;
        const icon = leaflet.divIcon({
          className: "map-pin-wrap",
          html: `<span class="map-pin-row${active ? " is-active" : ""}"><span class="map-dot speed-${speedClass(station.speed)}"></span>${
            hint ? `<span class="map-pin-kw">${hint}</span>` : ""
          }</span>`,
          iconSize: [width, 22],
          iconAnchor: [11, 11],
        });
        const marker = leaflet.marker([station.lat, station.lng], {
          icon,
          keyboard: true,
          title: station.name,
          zIndexOffset: active ? 600 : 0,
        });
        marker.on("click", () => onSelectRef.current(station.id));
        marker.addTo(layer);
      }
    };

    draw();
    map.on("zoomend", draw);
    return () => {
      map.off("zoomend", draw);
      layer.clearLayers();
    };
  }, [ready, stations, selectedId]);

  useEffect(() => {
    if (!ready) return;
    const you = youRef.current;
    const leaflet = leafletRef.current;
    if (!you || !leaflet) return;
    you.clearLayers();
    if (!showYou) return;
    const icon = leaflet.divIcon({
      className: "map-pin-wrap",
      html: '<span class="you-pin"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    leaflet
      .marker([origin.lat, origin.lng], {
        icon,
        keyboard: false,
        zIndexOffset: 800,
        interactive: false,
        title: "You are here",
      })
      .addTo(you);
    return () => {
      you.clearLayers();
    };
  }, [ready, showYou, origin.lat, origin.lng]);

  return (
    <div className="charge-map">
      <div ref={holderRef} className="charge-map-canvas" />
      {ready ? null : <div className="map-skeleton" role="status" aria-label="Loading map" />}
    </div>
  );
}
