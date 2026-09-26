"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { NomadMapSlot } from "@/components/nepal/NomadMapSlot";
import { haversineKm } from "@/lib/geo";
import {
  mappedPlaces,
  type NomadAttribution,
  type NomadBadge,
  type NomadCity,
  type NomadNote,
  type NomadPlace,
  type NomadStay,
} from "@/lib/nepal/nomad";

const BADGE_LABEL: Record<NomadBadge, string> = {
  listed: "Listed; not confirmed",
  stale: "May be outdated",
};

type Layer = "stay" | "cowork" | "cafe";

export function NomadCityGuide({ city }: { city: NomadCity }) {
  const stays = city.stays ?? [];
  const [areaName, setAreaName] = useState<string | null>(city.neighbourhoods[0]?.name ?? null);
  const [stayName, setStayName] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    stay: true,
    cowork: true,
    cafe: true,
  });
  const area = city.neighbourhoods.find((place) => place.name === areaName) ?? null;
  const stay = stays.find((place) => place.name === stayName) ?? null;
  const focus = stay ?? area;

  const pins = useMemo(() => {
    const rows: { name: string; lat: number; lng: number; kind: Layer }[] = [];
    if (layers.stay) {
      for (const place of mappedPlaces(stays)) rows.push({ ...place, kind: "stay" });
    }
    if (layers.cowork) {
      for (const place of mappedPlaces(city.coworking)) rows.push({ ...place, kind: "cowork" });
    }
    if (layers.cafe) {
      for (const place of mappedPlaces(city.cafes)) rows.push({ ...place, kind: "cafe" });
    }
    return rows;
  }, [city.cafes, city.coworking, layers.cafe, layers.cowork, layers.stay, stays]);

  return (
    <main className="page-wrap nomad-guide">
      <header className="page-hero">
        <p className="eyebrow">Nomad · {city.province}</p>
        <h1 className="font-display page-title">{city.name}</h1>
        <p className="lede">{city.blurb}</p>
        <Attribution stat={city.blurbSource} />
      </header>

      <section className="ref-strip" aria-label="Reference figures">
        <p className="meta-label">Reference</p>
        <ul>
          {city.stats.map((stat) => (
            <li key={stat.id}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </li>
          ))}
        </ul>
        <p className="fine">
          Source: Nomads.com, as of {city.stats[0]?.asOf ?? "26 Sep 2026"}. Ranking changes daily.
        </p>
        <p className="fine">
          <a href={city.ookla.url} target="_blank" rel="noopener noreferrer">
            {city.ookla.label}
          </a>
        </p>
      </section>

      <section className="nomad-section">
        <h2>Best areas to live</h2>
        <p className="section-lead">
          Pick an area to focus the work list. Distance shows only when both the area and the workplace have a
          published coordinate.
        </p>
        {city.neighbourhoods.length === 0 ? (
          <p className="empty-inline">Neighbourhood notes are not listed yet.</p>
        ) : (
          <div className="area-grid">
            {city.neighbourhoods.map((place) => (
              <article key={place.name} className={place.name === areaName ? "area-card is-on" : "area-card"}>
                <h3>{place.name}</h3>
                {place.note ? <p>{place.note}</p> : null}
                <Attribution stat={place} />
                <button type="button" className="btn-secondary" onClick={() => {
                  setAreaName(place.name);
                  setStayName(null);
                }}>
                  {place.name === areaName && !stay ? "Selected" : "Focus work nearby"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="nomad-section">
        <h2>Places to stay</h2>
        <p className="section-lead">
          Nomad-friendly hotels, guesthouses, serviced apartments, and coliving.
        </p>
        {stays.length === 0 ? (
          <p className="empty-inline">
            Verified stays are not in yet. This list stays empty until each place has a source, a coordinate, and a
            type. Nothing here is a sample.
          </p>
        ) : (
          <div className="stay-grid">
            {stays.map((place) => (
              <StayCard
                key={place.name}
                place={place}
                selected={place.name === stayName}
                onSelect={() => setStayName(place.name)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="nomad-section">
        <h2>Work nearby</h2>
        <p className="section-lead">
          {focus
            ? `Sorted around ${focus.name}. A card names its area when a kilometre figure is not available.`
            : "Coworking spaces first, then laptop-friendly cafés."}
        </p>
        <PlaceGrid title="Coworking" places={city.coworking} focus={focus} />
        <PlaceGrid title="Wifi cafés" places={city.cafes} focus={focus} />
      </section>

      <section className="nomad-section">
        <h2>Map</h2>
        <div className="layer-toggle" role="group" aria-label="Map layers">
          <LayerButton on={layers.stay} label="Stays" onClick={() => setLayers((value) => ({ ...value, stay: !value.stay }))} />
          <LayerButton on={layers.cowork} label="Coworking" onClick={() => setLayers((value) => ({ ...value, cowork: !value.cowork }))} />
          <LayerButton on={layers.cafe} label="Cafés" onClick={() => setLayers((value) => ({ ...value, cafe: !value.cafe }))} />
        </div>
        {pins.length > 0 ? (
          <NomadMapSlot pins={pins} />
        ) : (
          <p className="empty-inline nomad-map-empty">
            No mapped points for the layers that are on. Stays do not have coordinates yet, and a workplace is pinned
            only when a coordinate was published with it.
          </p>
        )}
      </section>

      <NoteSection title="Visa and stay" notes={city.visa} empty="Visa and stay rules are not listed yet.">
        <p className="fine nomad-caveat">
          Rules change. Check the{" "}
          <a href="https://www.immigration.gov.np/visa-information" target="_blank" rel="noopener noreferrer">
            Department of Immigration
          </a>{" "}
          before you travel.
        </p>
      </NoteSection>
      <NoteSection title="SIM and data" notes={city.sim} empty="SIM and data notes are not listed yet." />
      <NoteSection title="Season" notes={[city.season]} empty="Season notes are not listed yet." />
      <NoteSection title="Practical tips" notes={city.tips} empty="Practical tips are not listed yet." />

      <section className="nomad-section">
        <h2>In {city.name}</h2>
        <div className="link-row">
          <Link className="btn-primary" href={`/charge?q=${encodeURIComponent(city.name)}`}>
            Charge
          </Link>
          <Link className="btn-secondary" href={`/events?q=${encodeURIComponent(city.name)}`}>
            Events
          </Link>
          <Link className="btn-secondary" href={`/jobs?q=${encodeURIComponent(city.name)}`}>
            Jobs
          </Link>
        </div>
      </section>
      <p className="fine">
        <Link href="/nomad" className="fine-link">
          All nomad cities
        </Link>
      </p>
    </main>
  );
}

function LayerButton({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={on ? "chip chip-on" : "chip"} aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  );
}

function StayCard({
  place,
  selected,
  onSelect,
}: {
  place: NomadStay;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={selected ? "stay-card is-on" : "stay-card"}>
      <p className="meta-label">{place.type}</p>
      <h3>
        {place.url ? (
          <a href={place.url} target="_blank" rel="noopener noreferrer">
            {place.name}
          </a>
        ) : (
          place.name
        )}
      </h3>
      {place.area ? <p className="station-meta">{place.area}</p> : null}
      {place.features.length > 0 ? (
        <ul className="connector-chips">
          {place.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="btn-secondary" onClick={onSelect}>
        {selected ? "Distances use this stay" : "Measure work from here"}
      </button>
      <Attribution stat={place} />
    </article>
  );
}

function PlaceGrid({
  title,
  places,
  focus,
}: {
  title: string;
  places: NomadPlace[];
  focus: NomadPlace | null;
}) {
  const ordered = [...places].sort((a, b) => {
    const left = distanceKm(focus, a);
    const right = distanceKm(focus, b);
    if (left == null && right == null) return a.name.localeCompare(b.name);
    if (left == null) return 1;
    if (right == null) return -1;
    return left - right;
  });
  return (
    <div className="work-block">
      <h3>{title}</h3>
      {ordered.length === 0 ? (
        <p className="empty-inline">Not listed yet.</p>
      ) : (
        <div className="work-grid">
          {ordered.map((place) => {
            const km = distanceKm(focus, place);
            return (
              <article key={place.name} className="work-card">
                <h4>
                  {place.url ? (
                    <a href={place.url} target="_blank" rel="noopener noreferrer">
                      {place.name}
                    </a>
                  ) : (
                    place.name
                  )}
                </h4>
                {place.badges.length > 0 ? (
                  <p className="badge-row">
                    {place.badges.map((badge) => (
                      <span key={badge} className={`badge badge-${badge}`}>
                        {BADGE_LABEL[badge]}
                      </span>
                    ))}
                  </p>
                ) : null}
                <p className="station-meta">
                  {place.area || "Area not listed"}
                  {km != null ? ` · ${km < 10 ? km.toFixed(1) : Math.round(km)} km from ${focus?.name}` : ""}
                </p>
                {place.note ? <p>{place.note}</p> : null}
                <Attribution stat={place} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function distanceKm(focus: NomadPlace | null, place: NomadPlace): number | null {
  if (!focus || focus.lat == null || focus.lng == null || place.lat == null || place.lng == null) return null;
  return haversineKm(focus.lat, focus.lng, place.lat, place.lng);
}

function SourceLink({ item }: { item: NomadAttribution }) {
  if (!item.sourceUrl) return item.source;
  return (
    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
      {item.source}
    </a>
  );
}

function Attribution({ stat }: { stat: NomadAttribution & { also?: NomadAttribution[] } }) {
  const also = stat.also ?? [];
  return (
    <div className="fine source-block">
      <p>
        Source: <SourceLink item={stat} />, as of {stat.asOf}
      </p>
      {also.length > 0 ? (
        <p>
          Also:{" "}
          {also.map((item, index) => (
            <span key={`${item.sourceUrl || item.source}-${item.asOf}`}>
              {index > 0 ? " · " : null}
              <SourceLink item={item} />, as of {item.asOf}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function NoteSection({
  title,
  notes,
  empty,
  children,
}: {
  title: string;
  notes: NomadNote[];
  empty: string;
  children?: ReactNode;
}) {
  return (
    <section className="nomad-section">
      <h2>{title}</h2>
      {notes.length === 0 ? (
        <p className="empty-inline">{empty}</p>
      ) : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.title} className="app-card">
              <h3>{note.title}</h3>
              <p>{note.body}</p>
              <Attribution stat={note} />
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}
