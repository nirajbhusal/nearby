export type MapTheme = "dark" | "light";

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
