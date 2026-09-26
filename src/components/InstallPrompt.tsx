"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nearby-install-dismissed";
const VISIT_KEY = "nearby-visit-count";
const VISIT_MARK = "nearby-visit-marked";
const VIEWS_KEY = "nearby-page-views";
const START_KEY = "nearby-session-start";

let trackedPath: string | null = null;
let promptEvent: InstallEvent | null = null;
let iosHint = false;
let dismissed = false;
const listeners = new Set<() => void>();

export type InstallOffer = {
  mode: "none" | "prompt" | "ios";
  install: () => Promise<void>;
};

const NONE: InstallOffer = { mode: "none", install: async () => {} };
const IOS: InstallOffer = { mode: "ios", install: async () => {} };
const PROMPT: InstallOffer = {
  mode: "prompt",
  install: async () => {
    const event = promptEvent;
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    promptEvent = null;
    if (choice.outcome === "accepted") {
      dismissed = true;
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    publish();
  },
};

let current: InstallOffer = NONE;

function emit() {
  for (const listener of listeners) listener();
}

function publish() {
  const resolved = dismissed ? NONE : promptEvent ? PROMPT : iosHint ? IOS : NONE;
  if (resolved !== current) current = resolved;
  emit();
}

function snapshot(): InstallOffer {
  return current;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function readCount(storage: Storage, key: string): number {
  const value = Number(storage.getItem(key) || "0");
  return Number.isFinite(value) ? value : 0;
}

function noteVisit(): void {
  try {
    if (sessionStorage.getItem(VISIT_MARK) === "1") return;
    sessionStorage.setItem(VISIT_MARK, "1");
    const next = readCount(localStorage, VISIT_KEY) + 1;
    localStorage.setItem(VISIT_KEY, String(next));
  } catch {
    /* ignore */
  }
}

function notePageView(pathname: string): void {
  try {
    if (trackedPath === pathname) return;
    trackedPath = pathname;
    const next = readCount(sessionStorage, VIEWS_KEY) + 1;
    sessionStorage.setItem(VIEWS_KEY, String(next));
  } catch {
    /* ignore */
  }
}

function sessionStart(): void {
  try {
    if (Number(sessionStorage.getItem(START_KEY) || "0") > 0) return;
    sessionStorage.setItem(START_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function useInstallOffer(): InstallOffer {
  return useSyncExternalStore(subscribe, snapshot, () => NONE);
}

/** Captures the browser install event so the menu can offer it. No floating pill. */
export function InstallBridge() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    noteVisit();
    sessionStart();
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (window.matchMedia("(display-mode: standalone)").matches) {
      dismissed = true;
      publish();
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      promptEvent = event as InstallEvent;
      publish();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const standalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    iosHint = ios && safari && !standalone;
    publish();
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    notePageView(pathname);
  }, [pathname]);

  return null;
}
