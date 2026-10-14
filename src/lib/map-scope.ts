export const MAP_SCOPE_KEY = "nearby-map-scope";
export const MAP_SCOPE_EVENT = "nearby-map-scope";

export type MapScope = "nearby" | "all";

/** Runs in <head> before first paint so a saved All view does not flash Nearby. */
export const mapScopeBoot = `(function(){try{var v=localStorage.getItem("${MAP_SCOPE_KEY}");document.documentElement.dataset.mapScope=v==="all"?"all":"nearby"}catch(e){document.documentElement.dataset.mapScope="nearby"}})();`;

export function readMapScope(): MapScope {
  try {
    const stored = localStorage.getItem(MAP_SCOPE_KEY);
    if (stored === "all" || stored === "nearby") return stored;
  } catch {
    /* private mode */
  }
  return "nearby";
}

export function subscribeMapScope(onChange: () => void) {
  window.addEventListener(MAP_SCOPE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(MAP_SCOPE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeMapScope(scope: MapScope) {
  let current: string | null = null;
  try {
    current = localStorage.getItem(MAP_SCOPE_KEY);
    if (current !== scope) localStorage.setItem(MAP_SCOPE_KEY, scope);
  } catch {
    /* private mode */
  }
  document.documentElement.dataset.mapScope = scope;
  if (current === scope) return;
  window.dispatchEvent(new Event(MAP_SCOPE_EVENT));
}

/** A scope in the URL wins. Otherwise use the saved choice. */
export function effectiveMapScope(urlHasScope: boolean, urlScope: MapScope, saved: MapScope): MapScope {
  return urlHasScope ? urlScope : saved;
}
