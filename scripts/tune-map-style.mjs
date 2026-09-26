/**
 * Fetch OpenFreeMap Liberty and write calm dark and light styles.
 * Liberty has a full road stack, so casings can be quieted and POIs dropped.
 * Hillshade stays, at a low opacity, from the Natural Earth raster.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = "https://tiles.openfreemap.org/styles/liberty";
const outDir = path.join(process.cwd(), "public", "map");

const DARK = {
  land: "#0B0B0C",
  landAlt: "#111214",
  park: "#141C18",
  wood: "#121916",
  water: "#172430",
  waterLine: "#1E3144",
  building: "#16181C",
  road: "#2A2C31",
  roadMid: "#34373D",
  roadMajor: "#464A52",
  roadMotor: "#5A5F68",
  casing: "#0B0B0C",
  rail: "#2A2D33",
  boundary: "rgba(255, 255, 255, 0.22)",
  label: "#F2F2F7",
  halo: "#0B0B0C",
  sand: "#1A1814",
  ice: "#1A1E22",
  hill: ["interpolate", ["linear"], ["zoom"], 0, 0.14, 6, 0.04],
};

const LIGHT = {
  land: "#F3F2EE",
  landAlt: "#E7E6E1",
  park: "#E3EDDC",
  wood: "#E7F0E2",
  water: "#D5E4F0",
  waterLine: "#C5D7E6",
  building: "#E6E4DE",
  road: "#FFFFFF",
  roadMid: "#FFFFFF",
  roadMajor: "#FFFFFF",
  roadMotor: "#FFFFFF",
  casing: "#E4E1DA",
  rail: "#D5D3CE",
  boundary: "rgba(60, 60, 67, 0.28)",
  label: "#1C1C1E",
  halo: "#F7F6F2",
  sand: "#EFE6D6",
  ice: "#E8EEF2",
  hill: ["interpolate", ["linear"], ["zoom"], 0, 0.22, 6, 0.06],
};

function paint(layer, key, value) {
  layer.paint = { ...(layer.paint ?? {}), [key]: value };
}

function hide(layer) {
  layer.layout = { ...(layer.layout ?? {}), visibility: "none" };
}

function roadColor(id, palette) {
  if (/motorway/.test(id)) return palette.roadMotor;
  if (/trunk|primary/.test(id)) return palette.roadMajor;
  if (/secondary|tertiary/.test(id)) return palette.roadMid;
  return palette.road;
}

function tune(style, palette, name) {
  const next = structuredClone(style);
  next.name = name;
  for (const layer of next.layers) {
    const id = layer.id;
    if (
      /poi_|highway-shield|road_shield|one_way|oneway|park_outline|building-3d|hatching|_arrow/.test(id)
    ) {
      hide(layer);
      continue;
    }
    if (layer.type === "background") {
      paint(layer, "background-color", palette.land);
    } else if (layer.type === "raster" && id === "natural_earth") {
      paint(layer, "raster-opacity", palette.hill);
    } else if (layer.type === "fill") {
      let color = palette.landAlt;
      if (id === "water" || id === "water-intermittent") color = palette.water;
      else if (/^park$|landcover_grass|landcover-grass|landuse_pitch|landuse_park/.test(id)) color = palette.park;
      else if (/wood/.test(id)) color = palette.wood;
      else if (/(^|_)(ice|glacier|wetland)($|_)|landcover-ice|landcover_ice/.test(id)) color = palette.ice;
      else if (/sand/.test(id)) color = palette.sand;
      else if (/building/.test(id)) color = palette.building;
      paint(layer, "fill-color", color);
      if (color === palette.park) paint(layer, "fill-opacity", 0.85);
      if (layer.paint?.["fill-outline-color"]) paint(layer, "fill-outline-color", color);
    } else if (layer.type === "line") {
      let color = roadColor(id, palette);
      if (/waterway/.test(id)) color = palette.waterLine;
      else if (/casing/.test(id)) color = palette.casing;
      else if (/boundary/.test(id)) color = palette.boundary;
      else if (/rail/.test(id)) color = palette.rail;
      paint(layer, "line-color", color);
    } else if (layer.type === "symbol") {
      paint(layer, "text-color", palette.label);
      paint(layer, "text-halo-color", palette.halo);
      paint(layer, "text-halo-width", 1.25);
      paint(layer, "text-halo-blur", 0.5);
    }
  }
  return next;
}

const base = await fetch(SOURCE).then((response) => {
  if (!response.ok) throw new Error(`OpenFreeMap liberty ${response.status}`);
  return response.json();
});

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "style-dark.json"), JSON.stringify(tune(base, DARK, "Nearby Dark")));
await writeFile(path.join(outDir, "style-light.json"), JSON.stringify(tune(base, LIGHT, "Nearby Light")));
console.log("wrote public/map/style-dark.json and style-light.json");
