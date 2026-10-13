export const SIDEBAR_KEY = "nearby-sidebar";
export const SIDEBAR_EVENT = "nearby-sidebar";

/** Runs in <head> before first paint so a hidden sidebar does not flash open. */
export const sidebarBoot = `(function(){try{var v=localStorage.getItem("${SIDEBAR_KEY}");document.documentElement.dataset.sidebar=v==="hidden"?"hidden":"open"}catch(e){document.documentElement.dataset.sidebar="open"}})();`;

export function sidebarHiddenNow() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "hidden";
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

export function writeSidebarHidden(hidden: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, hidden ? "hidden" : "open");
  } catch {
    /* private mode */
  }
  document.documentElement.dataset.sidebar = hidden ? "hidden" : "open";
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}
