"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LngLatBounds, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import boundaries from "@/data/nepal/province-boundaries.json";
import { BASE_PATH } from "@/lib/base-path";
import { ensureMapWorker, mapStyleUrl, readMapTheme, type MapTheme } from "@/lib/map-style";
import { NEPAL_BBOX, type ProvinceRecord } from "@/lib/nepal/provinces";

type Props = {
  provinces: ProvinceRecord[];
};

function bubbleSize(count: number): number {
  return Math.round(26 + Math.sqrt(count) * 2.1);
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function paint(theme: MapTheme): { line: string; fill: string } {
  return theme === "light"
    ? { line: "#0b6e56", fill: "#0b6e56" }
    : { line: "#7dffe0", fill: "#00f5a0" };
}

export default function NepalMap({ provinces }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [fallback, setFallback] = useState(false);
  const [theme, setTheme] = useState<MapTheme>("dark");

  useEffect(() => {
    setTheme(readMapTheme());
    const onTheme = () => setTheme(readMapTheme());
    window.addEventListener("nearby-theme", onTheme);
    return () => window.removeEventListener("nearby-theme", onTheme);
  }, []);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || !hasWebGL()) {
      setFallback(true);
      return;
    }
    let map: MlMap | null = null;
    let alive = true;
    const markers: Marker[] = [];

    const addOutlines = () => {
      if (!map || map.getSource("provinces")) return;
      const colors = paint(readMapTheme());
      map.addSource("provinces", {
        type: "geojson",
        data: boundaries as unknown as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: "province-fill",
        type: "fill",
        source: "provinces",
        paint: { "fill-color": colors.fill, "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "province-line",
        type: "line",
        source: "provinces",
        paint: { "line-color": colors.line, "line-width": 1.25, "line-opacity": 0.7 },
      });
    };

    ensureMapWorker();
    map = new MlMap({
      container: holder,
      style: mapStyleUrl(readMapTheme()),
      center: [(NEPAL_BBOX[0] + NEPAL_BBOX[2]) / 2, (NEPAL_BBOX[1] + NEPAL_BBOX[3]) / 2],
      zoom: 5,
      minZoom: 4.2,
      maxZoom: 8,
      attributionControl: {
        compact: true,
        customAttribution: "Province boundaries © geoBoundaries (CC BY 3.0 IGO)",
      },
      scrollZoom: false,
      dragPan: false,
      dragRotate: false,
      boxZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      touchPitch: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    });
    map.on("error", () => {
      if (alive) setFallback(true);
    });
    map.on("style.load", () => addOutlines());
    map.on("load", () => {
      if (!alive || !map) return;
      addOutlines();
      const [west, south, east, north] = NEPAL_BBOX;
      map.fitBounds(new LngLatBounds([west, south], [east, north]), {
        padding: 28,
        duration: 0,
        maxZoom: 6.4,
      });
      for (const province of provinces) {
        const size = bubbleSize(province.count);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "map-pin-wrap";
        button.title = `${province.name}, ${province.count} chargers`;
        button.setAttribute("aria-label", `${province.name}, ${province.count} chargers. Open the province map.`);
        button.innerHTML = `<span class="province-bubble" style="width:${size}px;height:${size}px">${province.count}</span>`;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          router.push(`/charge?province=${province.slug}`);
        });
        markers.push(
          new Marker({ element: button, anchor: "center" })
            .setLngLat([province.lng, province.lat])
            .addTo(map),
        );
      }
      map.resize();
    });
    const onTheme = () => {
      map?.setStyle(mapStyleUrl(readMapTheme()));
    };
    window.addEventListener("nearby-theme", onTheme);
    const observer = new ResizeObserver(() => map?.resize());
    observer.observe(holder);

    return () => {
      alive = false;
      window.removeEventListener("nearby-theme", onTheme);
      observer.disconnect();
      for (const marker of markers) marker.remove();
      map?.remove();
    };
  }, [provinces, router]);

  if (fallback) {
    const src = theme === "light" ? `${BASE_PATH}/maps/nepal-overview-light.png` : `${BASE_PATH}/maps/nepal-overview-dark.png`;
    return (
      <img
        className="nepal-fallback"
        src={src}
        alt="Chargers across Nepal by province"
      />
    );
  }

  return <div ref={holderRef} className="nepal-map-canvas" />;
}
