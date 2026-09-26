"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Share, X } from "lucide-react";

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

function readCount(storage: Storage, key: string): number {
  const value = Number(storage.getItem(key) || "0");
  return Number.isFinite(value) ? value : 0;
}

function noteVisit(): number {
  try {
    if (sessionStorage.getItem(VISIT_MARK) === "1") return readCount(localStorage, VISIT_KEY);
    sessionStorage.setItem(VISIT_MARK, "1");
    const next = readCount(localStorage, VISIT_KEY) + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

function notePageView(pathname: string): number {
  try {
    const current = readCount(sessionStorage, VIEWS_KEY);
    if (trackedPath === pathname) return current;
    trackedPath = pathname;
    const next = current + 1;
    sessionStorage.setItem(VIEWS_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

function sessionStart(): number {
  try {
    const existing = Number(sessionStorage.getItem(START_KEY) || "0");
    if (existing > 0) return existing;
    const now = Date.now();
    sessionStorage.setItem(START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function chargePath(pathname: string): boolean {
  return pathname.startsWith("/charge") || pathname.startsWith("/ev");
}

export function InstallPrompt() {
  const pathname = usePathname() || "/";
  const eventRef = useRef<InstallEvent | null>(null);
  const [hasEvent, setHasEvent] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    let storedDismiss = false;
    try {
      storedDismiss = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      storedDismiss = false;
    }
    setDismissed(storedDismiss);

    const visits = noteVisit();
    const start = sessionStart();
    const elapsed = Date.now() - start;
    const sync = (views: number) => {
      setEngaged(visits >= 2 || views >= 2 || Date.now() - start >= 30_000);
    };
    sync(notePageView(pathname));
    const remaining = Math.max(0, 30_000 - elapsed);
    const timer = window.setTimeout(() => setEngaged(true), remaining);

    const onPrompt = (promptEvent: Event) => {
      promptEvent.preventDefault();
      eventRef.current = promptEvent as InstallEvent;
      setHasEvent(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const standalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (ios && safari && !standalone) setIosHint(true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
    // Visit + timer are session-scoped. Page views update in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const views = notePageView(pathname);
    try {
      const visits = readCount(localStorage, VISIT_KEY);
      const start = Number(sessionStorage.getItem(START_KEY) || "0");
      const waited = start > 0 && Date.now() - start >= 30_000;
      if (visits >= 2 || views >= 2 || waited) setEngaged(true);
    } catch {
      if (views >= 2) setEngaged(true);
    }
  }, [pathname]);

  function dismiss() {
    setDismissed(true);
    eventRef.current = null;
    setHasEvent(false);
    setIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    const event = eventRef.current;
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    eventRef.current = null;
    setHasEvent(false);
    if (choice.outcome === "accepted") dismiss();
  }

  if (dismissed || !engaged || chargePath(pathname) || (!hasEvent && !iosHint)) return null;

  return (
    <div className="install-prompt glass-bar" role="region" aria-label="Install Nearby">
      <p>
        {hasEvent ? (
          "Install Nearby"
        ) : (
          <>
            Add via <Share size={14} aria-hidden /> Share
          </>
        )}
      </p>
      <div className="install-actions">
        {hasEvent ? (
          <button type="button" className="btn-primary" onClick={install}>
            Install
          </button>
        ) : null}
        <button type="button" className="icon-btn" onClick={dismiss} aria-label="Dismiss install hint">
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
