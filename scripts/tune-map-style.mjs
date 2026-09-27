/**
 * Hand-built OpenMapTiles styles for OpenFreeMap.
 * Land, water, a four-step road stack, buildings only from z16, a dim mask outside
 * the official 2020 Nepal outline, that outline plus province lines, and English
 * city/town/major-road labels. The basemap `boundary` layer is not used, so
 * OpenStreetMap admin lines never draw. Tiles and glyphs stay on OpenFreeMap.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "map");
const provincesPath = path.join(process.cwd(), "src/data/nepal/province-boundaries.json");
const outlinePath = path.join(process.cwd(), "src/data/nepal/nepal-outline.geojson");

const DARK = {
  land: "#141414",
  water: "#1c1c1c",
  waterLine: "#242424",
  building: "#1a1a1a",
  minor: "#1c1c1c",
  mid: "#2a2a2a",
  major: "#3a3a3a",
  casing: "#0a0a0a",
  label: "rgba(237, 237, 237, 0.78)",
  halo: "#141414",
  line: "rgba(255, 255, 255, 0.28)",
  outline: "rgba(255, 255, 255, 0.92)",
  mask: "#0a0a0a",
};

const LIGHT = {
  land: "#f7f7f7",
  water: "#e8e8e8",
  waterLine: "#dedede",
  building: "#ffffff",
  minor: "#ffffff",
  mid: "#ffffff",
  major: "#f3f3f3",
  casing: "#e5e5e5",
  label: "rgba(10, 10, 10, 0.78)",
  halo: "#f7f7f7",
  line: "rgba(10, 10, 10, 0.28)",
  outline: "rgba(10, 10, 10, 0.88)",
  mask: "#ececec",
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

function style(palette, name, nepal, provinces, outline, mask) {
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
      "nepal-outline": { type: "geojson", data: outline },
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
        id: "country-outline",
        type: "line",
        source: "nepal-outline",
        paint: { "line-color": palette.outline, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 8, 2.4] },
      },
      {
        id: "province-boundary",
        type: "line",
        source: "nepal-provinces",
        paint: { "line-color": palette.line, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.45, 8, 0.9], "line-opacity": 0.7 },
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
const outline = JSON.parse(await readFile(outlinePath, "utf8"));
const nepal = outline.features[0].geometry;
const ring = nepal.coordinates[0];
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
await writeFile(path.join(outDir, "nepal-outline.geojson"), JSON.stringify(outline));
await writeFile(path.join(outDir, "nepal-mask.geojson"), JSON.stringify(mask));
await writeFile(path.join(outDir, "style-dark.json"), JSON.stringify(style(DARK, "Nearby Dark", nepal, provinces, outline, mask)));
await writeFile(path.join(outDir, "style-light.json"), JSON.stringify(style(LIGHT, "Nearby Light", nepal, provinces, outline, mask)));
const dark = JSON.parse(await readFile(path.join(outDir, "style-dark.json"), "utf8"));
console.log(`wrote hand-built map styles (${dark.layers.length} layers)`);
