"use client";

import { DirectionsLink } from "@/components/nepal/NavigateLinks";
import { SwipeHint, SwipeRow } from "@/components/motion/SwipeRow";
import { foodHref } from "@/lib/item-link";
import { formatDistance, type DistanceUnit } from "@/lib/local-profile";
import { categoryLabels, instagramHref, siteLabel, type FoodSpot } from "@/lib/nepal/food";

export function FoodList({
  spots,
  unit,
  selectedId,
  onSelect,
}: {
  spots: FoodSpot[];
  unit: DistanceUnit;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <SwipeHint />
      <ul className="food-list">
        {spots.map((spot) => {
          const labels = categoryLabels(spot);
          const meta = [spot.area, spot.town, formatDistance(spot.distanceKm, unit)].filter(Boolean);
          return (
            <li key={spot.id} className={spot.id === selectedId ? "is-selected" : undefined}>
              <SwipeRow
                item={{
                  id: spot.id,
                  kind: "food",
                  title: spot.name,
                  subtitle: [labels[0], spot.area].filter(Boolean).join(" · "),
                  href: foodHref(spot.id, spot.city === "Pokhara" ? "pokhara" : "kathmandu"),
                }}
                share={{ title: spot.name, text: spot.name, url: foodHref(spot.id, spot.city === "Pokhara" ? "pokhara" : "kathmandu") }}
              >
                <div className="station-row food-row">
                  <button type="button" className="station-open" onClick={() => onSelect(spot.id)}>
                    <span className="station-copy">
                      <span className="station-name">{spot.name}</span>
                      <span className="station-meta">{meta.join(" · ")}</span>
                      <span className="station-plugs">
                        {labels.map((label) => (
                          <span className="plug-pill" key={label}>
                            {label}
                          </span>
                        ))}
                        {spot.opening_hours ? <span className="plug-pill">{spot.opening_hours}</span> : null}
                      </span>
                    </span>
                  </button>
                  <div className="food-row-side">
                    {spot.website || spot.instagram ? (
                      <span className="food-card-links">
                        {spot.website ? (
                          <a className="ink-link" href={spot.website} target="_blank" rel="noopener noreferrer">
                            {siteLabel(spot.website)}
                          </a>
                        ) : null}
                        {spot.instagram ? (
                          <a className="ink-link" href={instagramHref(spot.instagram)} target="_blank" rel="noopener noreferrer">
                            Instagram
                          </a>
                        ) : null}
                      </span>
                    ) : null}
                    <a className="text-btn food-maps" href={spot.google_maps_url} target="_blank" rel="noopener noreferrer">
                      Open in Google Maps
                    </a>
                    <DirectionsLink lat={spot.lat} lng={spot.lng} name={spot.name} compact />
                  </div>
                </div>
              </SwipeRow>
            </li>
          );
        })}
      </ul>
    </>
  );
}
