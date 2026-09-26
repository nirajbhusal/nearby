"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Calendar, MapPin, Tag } from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { Chip, ChipRow, CuratedNote } from "@/components/nepal/Chip";
import { EmptyState } from "@/components/nepal/EmptyState";
import { DistanceText } from "@/components/DistanceText";
import { SaveButton } from "@/components/SaveButton";
import { categoryLabel, formatUpdated } from "@/lib/nepal/format";
import { jobInterestMatch, preferMatches } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";
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

function stripPostcode(part: string): string {
  return part.replace(/\b\d{4,6}\b/g, "").replace(/\s+/g, " ").trim();
}

function shortArea(card: JobRoleCard): string {
  const raw = card.address || card.location || card.placeLabel;
  const parts = raw
    .split(",")
    .map((part) => stripPostcode(part.replace(/\(.*?\)/g, "")))
    .filter((part) => part && !/^nepal$/i.test(part) && !/plus code/i.test(part));
  const street = /\b(marg|road|rd|sadak|street|path|lane|tole)\b/i;
  const local = parts.filter((part, index) => !(index === 0 && street.test(part)));
  const area = (local.length ? local : parts).slice(-2).join(", ");
  return area || card.placeLabel;
}

function RoleCard({ card }: { card: JobRoleCard }) {
  const area = shortArea(card);
  return (
    <article className="role-card app-card">
      <div className="role-mark" aria-hidden>
        {initial(card.company.name)}
      </div>
      <div className="role-copy">
        <h3>{card.title}</h3>
        <p>
          {card.company.name}
          {area ? ` · ${area}` : ""}
        </p>
        <div className="meta-row">
          <span className="meta-chip">
            <Tag aria-hidden />
            {categoryLabel(card.category)}
          </span>
          {card.seen ? (
            <span className="meta-chip">
              <Calendar aria-hidden />
              {formatUpdated(card.seen)}
            </span>
          ) : null}
          {card.distanceKm != null ? (
            <span className="meta-chip">
              <MapPin aria-hidden />
              <DistanceText km={card.distanceKm} />
            </span>
          ) : null}
        </div>
        <div className="card-footer">
          <a className="btn-secondary card-action" href={card.url} target="_blank" rel="noopener noreferrer">
            Apply
          </a>
          <SaveButton
            item={{
              id: card.key,
              kind: "job",
              title: card.title,
              subtitle: card.company.name,
              href: card.url,
            }}
          />
        </div>
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const categories = useMemo(() => jobCategories(), []);
  const cities = useMemo(() => jobCities(origin), [origin]);
  const { near } = useMemo(
    () => companiesNear(origin, { category, city, remoteOnly: false }),
    [origin, category, city],
  );
  const profile = useProfile();
  const cards = useMemo(() => {
    const rows = jobRoleCards(near);
    return preferMatches(rows, profile.jobInterests, (card) => jobInterestMatch(card, profile.jobInterests));
  }, [near, profile.jobInterests]);
  const PAGE = 12;
  const [limit, setLimit] = useState(PAGE);
  const listKey = `${origin.label}|${category ?? ""}|${city ?? ""}`;
  useEffect(() => {
    setLimit(PAGE);
  }, [listKey]);
  const shown = cards.slice(0, limit);
  const pins = useMemo(() => jobMapPins(near, origin), [near, origin]);
  const active = pins.find((pin) => pin.id === selectedPin) ?? pins[0] ?? null;
  const pinRoles = useMemo(() => {
    if (!active) return [];
    return cards.filter((card) => active.slugs.includes(card.company.slug));
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
      <div className="jobs-sticky">
      <div className="jobs-toolbar">
        <p className="fine tabular">
          {cards.length} open role{cards.length === 1 ? "" : "s"} near {origin.label}.
        </p>
        <ViewToggle
          label="Jobs view"
          value={view}
          options={[
            { id: "cards", label: "Cards" },
            { id: "map", label: "Map" },
          ]}
          onChange={setView}
        />
      </div>
      <div className="filter-scroll" role="group" aria-label="Category">
        <button type="button" className={filtersOpen ? "chip chip-on" : "chip"} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
          Filters
        </button>
        <Chip pressed={!category} onClick={() => setCategory(null)}>
          Any
        </Chip>
        {categories.map((item) => (
          <Chip key={item} pressed={category === item} onClick={() => setCategory(item)}>
            {categoryLabel(item)}
          </Chip>
        ))}
      </div>
      {filtersOpen && cities.length > 1 ? (
        <div className="filter-sheet">
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
        </div>
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
                  </span>
                </h3>
                <ul>
                  {pinRoles.map((card) => (
                    <li key={card.key}>
                      <strong>{card.title}</strong>
                      <span>
                        {card.company.name}
                        {` · ${shortArea(card)}`}
                        {card.seen ? ` · seen ${formatUpdated(card.seen)}` : ""}
                      </span>
                      <a className="btn-secondary apply-link" href={card.url} target="_blank" rel="noopener noreferrer">
                        Apply
                      </a>
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
        <>
          <div className="role-grid">
            {shown.map((card) => (
              <RoleCard key={card.key} card={card} />
            ))}
          </div>
          {shown.length < cards.length ? (
            <button type="button" className="show-more" onClick={() => setLimit((value) => value + PAGE)}>
              Show more
            </button>
          ) : null}
        </>
      )}
      <CuratedNote />
    </div>
  );
}
