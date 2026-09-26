import type { Metadata } from "next";
import { Suspense } from "react";
import { ChargeExplorer } from "@/components/charge/ChargeExplorer";

export const metadata: Metadata = {
  title: "EV charging map — Nearby",
  description:
    "Map of EV chargers in Nepal. Search a city or use your location, filter by speed and connector, and navigate.",
};

export default function ChargePage() {
  return (
    <Suspense
      fallback={
        <div className="charge-stage">
          <div className="map-skeleton" role="status" aria-label="Loading the charger map" />
        </div>
      }
    >
      <ChargeExplorer />
    </Suspense>
  );
}
