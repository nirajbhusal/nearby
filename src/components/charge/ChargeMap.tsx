"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MlMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { pinHint, type NearbyStation } from "@/lib/nepal/ev";
import { clusterStations } from "@/components/charge/cluster";
import { ensureMapWorker, mapStyleUrl, readMapTheme } from "@/lib/map-style";

export type MapFrame =
  | { mode: "bounds"; bbox: [number, number, number, number] }
  | { mode: "point"; lng: number; lat: number; zoom: number };

type Props = {
  stations: NearbyStation[];
  origin: { lat: number; lng: number };
  frame: MapFrame;
  selectedId: string | null;
  showYou: boolean;
  onSelect: (id: string) => void;
};

function frameKey(frame: MapFrame): string {
  if (frame.mode === "bounds") return `b:${frame.bbox.join(",")}`;
  return `p:${frame.lng.toFixed(4)},${frame.lat.toFixed(4)},${frame.zoom}`;
}

function applyFrame(map: MlMap, frame: MapFrame) {
  map.resize();
  if (frame.mode === "bounds") {
    const [west, south, east, north] = frame.bbox;
    const country = east - west > 6;
    const wide = window.innerWidth >= 1024;
    map.fitBounds(new LngLatBounds([west, south], [east, north]), {
      padding: wide
        ? { top: 72, right: 40, bottom: 40, left: 400 }
        : { top: 118, right: 18, bottom: country ? 408 : 168, left: 18 },
      duration: 0,
      maxZoom: country ? 6.6 : 11,
    });
    return;
  }
  map.jumpTo({ center: [frame.lng, frame.lat], zoom: frame.zoom });
}

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
  frame,
  selectedId,
  showYou,
  onSelect,
}: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const stationsRef = useRef(stations);
  const selectedRef = useRef(selectedId);
  const frameRef = useRef(frame);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    stationsRef.current = stations;
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
        customAttribution: "Province boundaries © geoBoundaries (CC BY 3.0 IGO)",
      },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.once("load", () => {
      if (!alive || !map) return;
      applyFrame(map, frameRef.current);
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
