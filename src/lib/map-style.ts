import { setWorkerUrl } from "maplibre-gl";
import { BASE_PATH } from "@/lib/base-path";

export type MapTheme = "dark" | "light";

let workerReady = false;

/** Next bundles MapLibre away from its worker file, so point at the public copy. */
export function ensureMapWorker(): void {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl(`${BASE_PATH}/maplibre/maplibre-gl-worker.mjs`);
  workerReady = true;
}


/** Key-free MapLibre styles from OpenFreeMap. No account, no API key. */
const STYLES: Record<MapTheme, string> = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/positron",
};

export function readMapTheme(): MapTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function mapStyleUrl(theme: MapTheme): string {
  return STYLES[theme];
}
