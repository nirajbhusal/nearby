export const SIDEBAR_KEY = "nearby-sidebar";
export const SIDEBAR_EVENT = "nearby-sidebar";

/** Runs in <head> before first paint. `hidden` from the old toggle is a rail now. */
export const sidebarBoot = `(function(){try{var v=localStorage.getItem("${SIDEBAR_KEY}");document.documentElement.dataset.sidebar=(v==="rail"||v==="hidden")?"rail":"open"}catch(e){document.documentElement.dataset.sidebar="open"}})();`;

export function sidebarRailNow() {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored === "rail" || stored === "hidden";
  } catch {
    return false;
  }
}

export function subscribeSidebar(onChange: () => void) {
  window.addEventListener(SIDEBAR_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeSidebarRail(rail: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, rail ? "rail" : "open");
  } catch {
    /* private mode */
  }
  document.documentElement.dataset.sidebar = rail ? "rail" : "open";
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}
