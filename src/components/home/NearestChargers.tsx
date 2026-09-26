"use client";

import { useEffect, useState } from "react";
import { SiteLink as Link } from "@/components/SiteLink";
import { Zap } from "lucide-react";
import { DistanceText } from "@/components/DistanceText";
import { SaveButton } from "@/components/SaveButton";
import { speedLabel } from "@/lib/nepal/format";

export type HomeCharger = {
  id: string;
  name: string;
  city: string | null;
  speed: string;
  distanceKm: number;
};

export function NearestChargers({ fallback }: { fallback: HomeCharger[] }) {
  const [rows, setRows] = useState(fallback);
  const [mode, setMode] = useState<"city" | "near">("city");

  useEffect(() => {
    let cancelled = false;
    const permissions = navigator.permissions;
    if (!permissions?.query) return;
    permissions
      .query({ name: "geolocation" })
      .then(async (status) => {
        if (cancelled || status.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { stationsNear } = await import("@/lib/nepal/ev");
          const origin = {
            label: "You",
            kind: "city" as const,
            city: null,
            district: null,
            province: null,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          const nearest = stationsNear(origin, {
            radiusKm: 40,
            fastOnly: false,
            plugs: [],
            network: null,
          }).slice(0, 4);
          if (cancelled || nearest.length === 0) return;
          setRows(
            nearest.map((station) => ({
              id: station.id,
              name: station.name,
              city: station.city,
              speed: station.speed,
              distanceKm: station.distanceKm,
            })),
          );
          setMode("near");
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="home-block" aria-label={mode === "near" ? "Nearest chargers" : "Chargers in Kathmandu"}>
      <div className="block-head">
        <h2>{mode === "near" ? "Nearest chargers" : "Chargers in Kathmandu"}</h2>
        <Link href={mode === "near" ? "/charge?near=1" : "/charge?q=Kathmandu"}>Open map</Link>
      </div>
      <ul className="preview-list">
        {rows.map((row) => (
          <li key={row.id} className="preview-line">
            <Link href={`/charge?q=${encodeURIComponent(row.city || "Kathmandu")}&station=${row.id}`} className="preview-row">
              <span className={`speed-dot speed-${row.speed === "fast" || row.speed === "slow" ? row.speed : "unknown"}`} aria-hidden />
              <span>
                <strong>{row.name}</strong>
                <small>
                  {speedLabel(row.speed)}
                  {row.city ? ` · ${row.city}` : ""} · <DistanceText km={row.distanceKm} />
                </small>
              </span>
              <Zap size={16} aria-hidden />
            </Link>
            <SaveButton
              item={{
                id: row.id,
                kind: "charger",
                title: row.name,
                subtitle: row.city ?? "",
                href: `/charge?station=${row.id}`,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
