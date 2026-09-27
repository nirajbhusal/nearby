"use client";

import { useSyncExternalStore } from "react";
import { Navigation } from "lucide-react";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  const nav = navigator as Navigator & { platform?: string };
  if (nav.platform === "MacIntel" && navigator.maxTouchPoints > 1) return "ios";
  return "desktop";
}

function subscribe() {
  return () => {};
}

export function googleMapsDir(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function directionsHref(lat: number, lng: number, name: string, platform: Platform): string {
  const q = encodeURIComponent(name);
  if (platform === "android") return `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  if (platform === "ios") return `maps://?daddr=${lat},${lng}&q=${q}`;
  return googleMapsDir(lat, lng);
}

export function DirectionsLink({
  lat,
  lng,
  name = "Destination",
  compact = false,
}: {
  lat: number;
  lng: number;
  name?: string;
  prominent?: boolean;
  compact?: boolean;
}) {
  const platform = useSyncExternalStore(subscribe, detectPlatform, () => "desktop" as Platform);
  const href = directionsHref(lat, lng, name, platform);
  const google = googleMapsDir(lat, lng);
  const external = platform === "desktop";
  if (compact) {
    return (
      <a
        className="icon-btn directions-icon"
        href={href}
        aria-label={`Directions to ${name}`}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        <Navigation size={18} strokeWidth={1.5} aria-hidden />
      </a>
    );
  }
  return (
    <div className="directions">
      <a
        className="btn-primary"
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        Directions
      </a>
      {platform !== "desktop" ? (
        <a className="text-btn" href={google} target="_blank" rel="noopener noreferrer">
          Google Maps
        </a>
      ) : null}
    </div>
  );
}

/** @deprecated Use DirectionsLink. Kept so older call sites stay a single link. */
export function NavigateLinks({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  prominent?: boolean;
  name?: string;
}) {
  return <DirectionsLink lat={lat} lng={lng} name={name} />;
}
