"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Briefcase } from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { categoryLabel, formatKm, formatUpdated } from "@/lib/nepal/format";
import {
  companiesNear,
  jobCategories,
  jobCities,
  jobMapPins,
  jobRoleCards,
  type JobRoleCard,
} from "@/lib/nepal/jobs";
import type { PlaceHit } from "@/lib/nepal/types";

const JobsMap = dynamic(() => import("@/components/nepal/JobsMap"), {
  ssr: false,
  loading: () => <div className="jobs-map map-skeleton" role="status" aria-label="Loading map" />,
});

function initial(name: string): string {
  const letter = name.replace(/[^A-Za-z0-9]/g, "").charAt(0);
  return (letter || "•").toUpperCase();
}

function RoleCard({ card }: { card: JobRoleCard }) {
  return (
    <article className="role-card">
      <div className="role-mark" aria-hidden>
        {initial(card.company.name)}
      </div>
      <div className="role-copy">
        <h3>{card.title}</h3>
        <p>
          {card.company.name}
          {" · "}
          {card.location || card.placeLabel}
        </p>
        <p className="role-meta">
          <span>{categoryLabel(card.category)}</span>
          {card.seen ? <span>Seen {formatUpdated(card.seen)}</span> : null}
          {card.distanceKm != null ? <span>{formatKm(card.distanceKm)}</span> : null}
        </p>
        <a className="btn-primary" href={card.url} target="_blank" rel="noopener noreferrer">
          Apply
        </a>
      </div>
    </article>
  );
}

export function JobsPanel({ origin }: { origin: PlaceHit }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "cards";
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const categories = useMemo(() => jobCategories(), []);
  const cities = useMemo(() => jobCities(origin), [origin]);
  const { near } = useMemo(
    () => companiesNear(origin, { category, city, remoteOnly: false }),
    [origin, category, city],
  );
  const cards = useMemo(() => jobRoleCards(near), [near]);
  const pins = useMemo(() => jobMapPins(near), [near]);
  const active = pins.find((pin) => pin.id === selectedPin) ?? pins[0] ?? null;
  const pinRoles = useMemo(() => {
    if (!active) return [];
    return cards.filter((card) => {
      const inCity = card.company.offices.some(
        (office) => (office.city || "Nepal").toLowerCase() === active.label.toLowerCase(),
      );
      if (active.grouped) return inCity;
      return card.company.offices.some(
        (office) =>
          office.lat != null &&
          Math.abs(office.lat - active.lat) < 0.0002 &&
          office.lng != null &&
          Math.abs(office.lng - active.lng) < 0.0002,
      );
    });
  }, [active, cards]);

  function setView(next: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "map") sp.set("view", "map");
    else sp.delete("view");
    const query = sp.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="jobs-board">
      <div className="jobs-toolbar">
        <ViewToggle
          label="Jobs view"
          value={view}
          options={[
            { id: "cards", label: "Cards" },
            { id: "map", label: "Map" },
          ]}
          onChange={setView}
        />
        <p className="fine">
          {cards.length} open role{cards.length === 1 ? "" : "s"} near {origin.label}. City filters use office
          cities. Street coordinates are still being collected, so the map groups centroid offices into one pin per
          city.
        </p>
      </div>
      <div className="space-y-3">
        <ChipRow label="Category">
          <Chip pressed={!category} onClick={() => setCategory(null)}>
            Any
          </Chip>
          {categories.map((item) => (
            <Chip key={item} pressed={category === item} onClick={() => setCategory(item)}>
              {categoryLabel(item)}
            </Chip>
          ))}
        </ChipRow>
        {cities.length > 1 ? (
          <ChipRow label="City">
            <Chip pressed={!city} onClick={() => setCity(null)}>
              Any nearby
            </Chip>
            {cities.map((item) => (
              <Chip key={item} pressed={city === item} onClick={() => setCity(item)}>
                {item}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>
      {view === "map" ? (
        pins.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No offices to map"
            body="None of the matching companies has a coordinate. Try another city, or switch to cards."
          />
        ) : (
          <div className="jobs-map-layout">
            <JobsMap pins={pins} selectedId={active?.id ?? null} onSelect={setSelectedPin} />
            {active ? (
              <section className="jobs-pin-list" aria-label={`Roles in ${active.label}`}>
                <h3>
                  {active.label}
                  <span>
                    {active.roleCount} role{active.roleCount === 1 ? "" : "s"}
                    {active.grouped ? " · city pin" : ""}
                  </span>
                </h3>
                <ul>
                  {pinRoles.map((card) => (
                    <li key={card.key}>
                      <a href={card.url} target="_blank" rel="noopener noreferrer">
                        {card.title}
                      </a>
                      <span>
                        {card.company.name}
                        {card.seen ? ` · seen ${formatUpdated(card.seen)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open roles in this view"
          body={`Nothing matched near ${origin.label}. Try another city, or clear the filters.`}
        />
      ) : (
        <div className="role-grid">
          {cards.map((card) => (
            <RoleCard key={card.key} card={card} />
          ))}
        </div>
      )}
      <CuratedNote />
    </div>
  );
}
