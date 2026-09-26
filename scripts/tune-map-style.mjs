/**
 * Hand-built OpenMapTiles styles for OpenFreeMap.
 * About 16 layers: land, water, a four-step road stack, buildings only from z16,
 * a dim mask outside Nepal, province lines, and English city/town/major-road labels.
 * Tiles and glyphs stay on OpenFreeMap. No API key, no POI icons, no park polygons.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "map");
const provincesPath = path.join(process.cwd(), "src/data/nepal/province-boundaries.json");

const DARK = {
  land: "#0b0d0f",
  water: "#16202b",
  waterLine: "#1c2c3c",
  building: "#14171c",
  minor: "#1a1e24",
  mid: "#2a3038",
  major: "#5c6572",
  casing: "#07080a",
  label: "rgba(245, 245, 247, 0.72)",
  halo: "#0b0d0f",
  line: "rgba(255, 255, 255, 0.28)",
  mask: "#050607",
};

const LIGHT = {
  land: "#e7e4de",
  water: "#d5e6f4",
  waterLine: "#c5d8ea",
  building: "#f7f6f3",
  minor: "#fbfaf8",
  mid: "#ffffff",
  major: "#ffffff",
  casing: "#d4d0c8",
  label: "rgba(28, 28, 30, 0.78)",
  halo: "#f4f2ee",
  line: "rgba(60, 60, 67, 0.35)",
  mask: "#d9d6d0",
};

function nameField() {
  return ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
}

function textPaint(palette) {
  return {
    "text-color": palette.label,
    "text-halo-color": palette.halo,
    "text-halo-width": 1.5,
    "text-halo-blur": 0.4,
  };
}

function width(stops) {
  return ["interpolate", ["exponential", 1.4], ["zoom"], ...stops];
}

/** Farthest vertex in each direction, so the mask follows Nepal instead of a box. */
function silhouette(features, buckets = 72) {
  const points = [];
  const walk = (coords) => {
    if (typeof coords[0] === "number") points.push(coords);
    else coords.forEach(walk);
  };
  for (const feature of features) walk(feature.geometry.coordinates);
  let sx = 0;
  let sy = 0;
  for (const [x, y] of points) {
    sx += x;
    sy += y;
  }
  const cx = sx / points.length;
  const cy = sy / points.length;
  const best = new Map();
  for (const [x, y] of points) {
    const ang = Math.atan2(y - cy, x - cx);
    const key = Math.round(((ang + Math.PI) / (Math.PI * 2)) * buckets) % buckets;
    const dist = (x - cx) ** 2 + (y - cy) ** 2;
    const prev = best.get(key);
    if (!prev || dist > prev.dist) best.set(key, { dist, x, y });
  }
  const ring = [...best.keys()]
    .sort((a, b) => a - b)
    .map((key) => {
      const point = best.get(key);
      const dx = point.x - cx;
      const dy = point.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      return [Number((point.x + (dx / len) * 0.12).toFixed(4)), Number((point.y + (dy / len) * 0.12).toFixed(4))];
    });
  ring.push(ring[0]);
  return ring;
}

function style(palette, name, nepal, provinces, mask) {
  const label = {
    "text-font": ["Noto Sans Regular"],
    "text-field": nameField(),
    "text-max-width": 8,
    "text-padding": 2,
  };
  return {
    version: 8,
    name,
    sources: {
      openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
      "nepal-provinces": { type: "geojson", data: provinces },
      "nepal-mask": { type: "geojson", data: mask },
    },
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    layers: [
      { id: "background", type: "background", paint: { "background-color": palette.land } },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: { "fill-color": palette.water },
      },
      {
        id: "waterway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "waterway",
        minzoom: 8,
        paint: {
          "line-color": palette.waterLine,
          "line-width": width([8, 0.4, 14, 1.4, 18, 3]),
        },
      },
      {
        id: "road-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 13,
        filter: ["match", ["get", "class"], ["minor", "service", "track", "street", "street_limited"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": palette.minor, "line-width": width([13, 0.2, 15, 0.6, 18, 3]), "line-opacity": 0.85 },
      },
      {
        id: "road-mid-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 8,
        filter: ["match", ["get", "class"], ["secondary", "tertiary"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": palette.casing, "line-width": width([8, 0.6, 12, 2.2, 16, 7]) },
      },
      {
        id: "road-mid",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 8,
        filter: ["match", ["get", "class"], ["secondary", "tertiary"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": palette.mid, "line-width": width([8, 0.3, 12, 1.2, 16, 4.5]) },
      },
      {
        id: "road-major-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 5,
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": palette.casing, "line-width": width([5, 0.6, 8, 1.6, 12, 4, 16, 10]) },
      },
      {
        id: "road-major",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 5,
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": palette.major, "line-width": width([5, 0.35, 8, 1, 12, 2.4, 16, 6]) },
      },
      {
        id: "building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 16,
        paint: { "fill-color": palette.building, "fill-opacity": 0.9 },
      },
      {
        id: "outside-nepal",
        type: "fill",
        source: "nepal-mask",
        paint: { "fill-color": palette.mask, "fill-opacity": 0.82 },
      },
      {
        id: "province-boundary",
        type: "line",
        source: "nepal-provinces",
        paint: { "line-color": palette.line, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 8, 1.25] },
      },
      {
        id: "road-label",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        minzoom: 12,
        filter: ["all", ["match", ["get", "class"], ["motorway", "trunk", "primary"], true, false], ["within", nepal]],
        layout: {
          ...label,
          "symbol-placement": "line",
          "text-size": 13,
          "text-rotation-alignment": "map",
        },
        paint: textPaint(palette),
      },
      {
        id: "place-town",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        minzoom: 7,
        filter: ["all", ["==", ["get", "class"], "town"], ["within", nepal]],
        layout: { ...label, "text-size": 13 },
        paint: textPaint(palette),
      },
      {
        id: "place-city",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        minzoom: 4,
        filter: ["all", ["==", ["get", "class"], "city"], ["within", nepal]],
        layout: { ...label, "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 4, 13, 8, 16, 12, 20] },
        paint: textPaint(palette),
      },
    ],
  };
}

const provinces = JSON.parse(await readFile(provincesPath, "utf8"));
const ring = silhouette(provinces.features);
const nepal = { type: "Polygon", coordinates: [ring] };
const mask = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-180, -85],
            [180, -85],
            [180, 85],
            [-180, 85],
            [-180, -85],
          ],
          [...ring].reverse(),
        ],
      },
    },
  ],
};

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "nepal-provinces.geojson"), JSON.stringify(provinces));
await writeFile(path.join(outDir, "nepal-mask.geojson"), JSON.stringify(mask));
await writeFile(path.join(outDir, "style-dark.json"), JSON.stringify(style(DARK, "Nearby Dark", nepal, provinces, mask)));
await writeFile(path.join(outDir, "style-light.json"), JSON.stringify(style(LIGHT, "Nearby Light", nepal, provinces, mask)));
const dark = JSON.parse(await readFile(path.join(outDir, "style-dark.json"), "utf8"));
console.log(`wrote hand-built map styles (${dark.layers.length} layers)`);
