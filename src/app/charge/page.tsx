import { Suspense } from "react";
import { ChargeExplorer } from "@/components/charge/ChargeExplorer";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "EV charging map — Nearby",
  "Map of EV chargers in Nepal. Search a city or use your location, filter by speed and connector, and navigate.",
  "/charge",
);

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
