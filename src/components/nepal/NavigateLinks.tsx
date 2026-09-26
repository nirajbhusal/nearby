"use client";

import { useState, useSyncExternalStore } from "react";
import { appleMapsDir, googleMapsDir } from "@/lib/nepal/format";

function prefersAppleMaps(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return false;
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  const nav = navigator as Navigator & { platform?: string };
  if (nav.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return /Macintosh|Mac OS X/i.test(ua);
}

function subscribe() {
  return () => {};
}

export function NavigateLinks({
  lat,
  lng,
  prominent = false,
}: {
  lat: number;
  lng: number;
  prominent?: boolean;
}) {
  const appleFirst = useSyncExternalStore(subscribe, prefersAppleMaps, () => false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const primary = appleFirst ? appleMapsDir(lat, lng) : googleMapsDir(lat, lng);

  async function copyCoordinates() {
    const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={prominent ? "navigate-prominent" : "navigate-row"}>
      <div className="nav-split">
        <a className="btn-primary" href={primary} target="_blank" rel="noopener noreferrer">
          Navigate
        </a>
        <button
          type="button"
          className="btn-primary nav-more"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="More ways to navigate"
          onClick={() => setOpen((value) => !value)}
        >
          <Chevron />
        </button>
      </div>
      {open ? (
        <div className="nav-sheet" role="dialog" aria-label="Navigate">
          <button type="button" className="nav-sheet-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="nav-sheet-card">
            <a href={appleMapsDir(lat, lng)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              Apple Maps
            </a>
            <a href={googleMapsDir(lat, lng)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              Google Maps
            </a>
            <button type="button" onClick={copyCoordinates}>
              {copied ? "Copied" : "Copy coordinates"}
            </button>
            <button type="button" className="nav-cancel" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9.5 12 15l6-5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
