"use client";

import { useSyncExternalStore } from "react";
import { appleMapsDir, googleMapsDir } from "@/lib/nepal/format";

function prefersAppleMaps(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
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
  const apple = useSyncExternalStore(subscribe, prefersAppleMaps, () => false);
  return (
    <div className={prominent ? "navigate-prominent" : "navigate-row"}>
      <a
        href={googleMapsDir(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        Navigate
      </a>
      {apple ? (
        <a
          href={appleMapsDir(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Apple Maps
        </a>
      ) : null}
    </div>
  );
}
