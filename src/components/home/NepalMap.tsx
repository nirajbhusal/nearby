"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LngLatBounds, Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import boundaries from "@/data/nepal/province-boundaries.json";
import { BASE_PATH } from "@/lib/base-path";
import { ensureMapWorker, mapStyleUrl, readMapTheme, type MapTheme } from "@/lib/map-style";
import { NEPAL_BBOX } from "@/lib/nepal/bbox";

type ProvincePin = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
};

type Props = {
  provinces: ProvincePin[];
};

type ParkedMap = {
  node: HTMLDivElement;
  map: MlMap;
  theme: MapTheme;
};

let parkHost: HTMLDivElement | null = null;
let parked: ParkedMap | null = null;

function parkHostEl(): HTMLDivElement {
  if (!parkHost) {
    parkHost = document.createElement("div");
    parkHost.dataset.parkedMap = "home";
    parkHost.style.cssText =
      "position:fixed;left:-10000px;top:0;width:320px;height:180px;visibility:hidden;pointer-events:none;";
    document.body.appendChild(parkHost);
  }
  return parkHost;
}

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
  const routerRef = useRef(router);
  const provincesRef = useRef(provinces);
  routerRef.current = router;
  provincesRef.current = provinces;
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

    let map: MlMap;
    let node: HTMLDivElement;
    let created = false;

    const addOutlines = () => {
      if (!map.getSource("provinces")) {
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
      }
    };

    if (parked) {
      node = parked.node;
      map = parked.map;
      holder.appendChild(node);
      const next = readMapTheme();
      if (parked.theme !== next) {
        parked.theme = next;
        map.setStyle(mapStyleUrl(next));
      }
      map.resize();
    } else {
      created = true;
      node = document.createElement("div");
      node.className = "nepal-map-live";
      node.style.cssText = "width:100%;height:100%;";
      holder.appendChild(node);
      ensureMapWorker();
      map = new MlMap({
        container: node,
        style: mapStyleUrl(readMapTheme()),
        center: [(NEPAL_BBOX[0] + NEPAL_BBOX[2]) / 2, (NEPAL_BBOX[1] + NEPAL_BBOX[3]) / 2],
        zoom: 5,
        minZoom: 4.2,
        maxZoom: 8,
        attributionControl: {
          compact: true,
          customAttribution: "Boundary © Survey Department of Nepal, official map 2020",
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
      parked = { node, map, theme: readMapTheme() };
      map.on("error", () => setFallback(true));
      map.on("style.load", () => addOutlines());
      map.on("load", () => {
        addOutlines();
        const [west, south, east, north] = NEPAL_BBOX;
        map.fitBounds(new LngLatBounds([west, south], [east, north]), {
          padding: 28,
          duration: 0,
          maxZoom: 6.4,
        });
        for (const province of provincesRef.current) {
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
            routerRef.current.push(`/charge?province=${province.slug}`);
          });
          new Marker({ element: button, anchor: "center" }).setLngLat([province.lng, province.lat]).addTo(map);
        }
        map.resize();
      });
    }

    const onTheme = () => {
      const next = readMapTheme();
      if (parked) parked.theme = next;
      map.setStyle(mapStyleUrl(next));
    };
    window.addEventListener("nearby-theme", onTheme);
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(holder);

    return () => {
      window.removeEventListener("nearby-theme", onTheme);
      observer.disconnect();
      if (node.isConnected) parkHostEl().appendChild(node);
      if (created && !parked) map.remove();
    };
    // The map is created once and parked across navigations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fallback) {
    const src = theme === "light" ? `${BASE_PATH}/maps/nepal-overview-light.png` : `${BASE_PATH}/maps/nepal-overview-dark.png`;
    return (
      <img
        className="nepal-fallback"
        src={src}
        alt="Chargers by province"
      />
    );
  }

  return <div ref={holderRef} className="nepal-map-canvas" />;
}
