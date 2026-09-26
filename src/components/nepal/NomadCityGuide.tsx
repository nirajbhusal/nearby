"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { DistanceText } from "@/components/DistanceText";
import { NomadMapSlot } from "@/components/nepal/NomadMapSlot";
import { SaveButton } from "@/components/SaveButton";
import {
  mappedWork,
  stayInArea,
  stayTypeLabel,
  workInArea,
  type NomadCity,
  type NomadNote,
  type NomadStay,
  type NomadWorkPlace,
} from "@/lib/nepal/nomad";

type Layer = "stay" | "cowork" | "cafe";

export function NomadCityGuide({ city }: { city: NomadCity }) {
  const [areaName, setAreaName] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    stay: true,
    cowork: true,
    cafe: true,
  });
  const listed = city.areas.map((area) => area.name);
  const stays = areaName ? city.stays.filter((stay) => stayInArea(stay, areaName, listed)) : city.stays;
  const coworking = areaName ? city.coworking.filter((place) => workInArea(place, areaName)) : city.coworking;
  const cafes = areaName ? city.cafes.filter((place) => workInArea(place, areaName)) : city.cafes;

  const pins = useMemo(() => {
    const rows: { name: string; lat: number; lng: number; kind: Layer }[] = [];
    if (layers.stay) {
      for (const place of stays) {
        if (place.lat == null || place.lng == null) continue;
        rows.push({ name: place.name, lat: place.lat, lng: place.lng, kind: "stay" });
      }
    }
    if (layers.cowork) {
      for (const place of mappedWork(coworking)) rows.push({ ...place, kind: "cowork" });
    }
    if (layers.cafe) {
      for (const place of mappedWork(cafes)) rows.push({ ...place, kind: "cafe" });
    }
    return rows;
  }, [cafes, coworking, layers.cafe, layers.cowork, layers.stay, stays]);

  const unmapped = stays.filter((stay) => stay.lat == null || stay.lng == null).length;

  function chooseArea(name: string) {
    setAreaName((current) => (current === name ? null : name));
  }

  return (
    <main className="page-wrap nomad-guide">
      <header className="page-hero">
        <p className="eyebrow">Nomad</p>
        <h1 className="font-display page-title">{city.name}</h1>
        {city.blurb ? <p className="lede">{city.blurb}</p> : null}
      </header>

      <section className="ref-strip" aria-label="Reference figures">
        <p className="meta-label">Reference</p>
        <ul>
          {city.reference.map((stat) => (
            <li key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </li>
          ))}
        </ul>
        {city.reference
          .filter((stat) => stat.note)
          .map((stat) => (
            <p key={stat.label} className="fine">
              {stat.note}
            </p>
          ))}
        <p className="fine">Source: Nomads.com, as of 26 Sep 2026. The ranking changes daily.</p>
        {city.ookla ? (
          <p className="fine">
            <a href={city.ookla.url} target="_blank" rel="noopener noreferrer">
              {city.ookla.label}
            </a>
          </p>
        ) : null}
      </section>

      <section className="nomad-section">
        <h2>Best areas to live</h2>
        <p className="section-lead">Tap an area to filter the stays and work below. Tap it again to show the whole city.</p>
        {city.areas.length === 0 ? (
          <p className="empty-inline">Areas are not listed yet.</p>
        ) : (
          <div className="area-grid">
            {city.areas.map((area) => {
              const on = area.name === areaName;
              return (
                <article key={area.name} className={on ? "area-card is-on" : "area-card"}>
                  <h3>{area.name}</h3>
                  {area.description ? <p>{area.description}</p> : null}
                  {area.suits.length > 0 ? (
                    <ul className="connector-chips">
                      {area.suits.map((suit) => (
                        <li key={suit}>{suit}</li>
                      ))}
                    </ul>
                  ) : null}
                  <button type="button" className="btn-secondary" aria-pressed={on} onClick={() => chooseArea(area.name)}>
                    {on ? "Showing this area" : "Show this area"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="nomad-section">
        <h2>Places to stay</h2>
        <p className="section-lead">
          {areaName ? `Stays in ${areaName}.` : "Hotels, guesthouses, hostels, apartments, and coliving with a cited source."}
        </p>
        {stays.length === 0 ? (
          <p className="empty-inline">No verified stays are listed for this area.</p>
        ) : (
          <div className="stay-grid">
            {stays.map((place) => (
              <StayCard key={place.id} citySlug={city.slug} cityName={city.name} place={place} />
            ))}
          </div>
        )}
      </section>

      <section className="nomad-section">
        <h2>Work nearby</h2>
        <p className="section-lead">
          {areaName ? `Coworking and cafés listed in ${areaName}.` : "Coworking spaces first, then laptop-friendly cafés."}
        </p>
        <PlaceGrid title="Coworking" places={coworking} city={city} saveKind="cowork" />
        <PlaceGrid title="Wifi cafés" places={cafes} city={city} />
      </section>

      <section className="nomad-section">
        <h2>Map</h2>
        <div className="layer-toggle" role="group" aria-label="Map layers">
          <LayerButton on={layers.stay} label="Stays" onClick={() => setLayers((value) => ({ ...value, stay: !value.stay }))} />
          <LayerButton on={layers.cowork} label="Coworking" onClick={() => setLayers((value) => ({ ...value, cowork: !value.cowork }))} />
          <LayerButton on={layers.cafe} label="Cafés" onClick={() => setLayers((value) => ({ ...value, cafe: !value.cafe }))} />
        </div>
        {unmapped > 0 ? (
          <p className="fine">
            {unmapped} stay{unmapped === 1 ? "" : "s"} {unmapped === 1 ? "is" : "are"} listed without a map point.
          </p>
        ) : null}
        {pins.length > 0 ? (
          <NomadMapSlot pins={pins} />
        ) : (
          <p className="empty-inline nomad-map-empty">No mapped points for the layers that are on.</p>
        )}
        {city.osmCredit ? <p className="fine">{city.osmCredit}</p> : null}
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
      <NoteSection title="Season" notes={city.season} empty="Season notes are not listed yet." />
      <NoteSection title="Practical tips" notes={city.tips} empty="Practical tips are not listed yet." />

      <section className="nomad-section">
        <h2>In {city.name.replace(/\s*\(.*\)$/, "")}</h2>
        <div className="link-row">
          <Link className="btn-primary" href={`/charge?q=${encodeURIComponent(city.slug === "kathmandu" ? "Kathmandu" : city.name)}`}>
            Charge
          </Link>
          <Link className="btn-secondary" href={`/events?q=${encodeURIComponent(city.slug === "kathmandu" ? "Kathmandu" : city.name)}`}>
            Events
          </Link>
          <Link className="btn-secondary" href={`/jobs?q=${encodeURIComponent(city.slug === "kathmandu" ? "Kathmandu" : city.name)}`}>
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

function StayCard({ place, citySlug, cityName }: { place: NomadStay; citySlug: string; cityName: string }) {
  return (
    <article className="stay-card">
      <div className="card-tools">
        <SaveButton
          item={{
            id: place.id,
            kind: "stay",
            title: place.name,
            subtitle: cityName,
            href: `/nomad/${citySlug}`,
          }}
        />
      </div>
      <p className="meta-label">{stayTypeLabel(place.type)}</p>
      <h3>{place.name}</h3>
      {place.area ? <p className="station-meta">{place.area}</p> : null}
      {place.address ? <p className="fine">{place.address}</p> : null}
      {place.features.length > 0 ? (
        <ul className="connector-chips">
          {place.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
      {place.price ? <p className="stay-price">{place.price}</p> : null}
      {place.website || place.bookingUrls.length > 0 ? (
        <p className="link-row">
          {place.website ? (
            <a className="btn-secondary" href={place.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          ) : null}
          {place.bookingUrls.map((url) => (
            <a key={url} className="btn-secondary" href={url} target="_blank" rel="noopener noreferrer">
              Book
            </a>
          ))}
        </p>
      ) : null}
      {place.nearbyWork.length > 0 ? (
        <div className="stay-work">
          <p className="meta-label">Work nearby</p>
          <ul className="connector-chips">
            {place.nearbyWork.map((item) => (
              <li key={item.id}>
                {item.name}
                {item.km != null ? (
                  <>
                    {" · "}
                    {place.approximateDistance ? "about " : null}
                    <DistanceText km={item.km} />
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function PlaceGrid({
  title,
  places,
  city,
  saveKind,
}: {
  title: string;
  places: NomadWorkPlace[];
  city: NomadCity;
  saveKind?: "cowork";
}) {
  const ordered = [...places].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="work-block">
      <h3>{title}</h3>
      {ordered.length === 0 ? (
        <p className="empty-inline">Not listed for this area.</p>
      ) : (
        <div className="work-grid">
          {ordered.map((place) => (
            <article key={place.id} className="work-card">
              {saveKind ? (
                <div className="card-tools">
                  <SaveButton
                    item={{
                      id: place.id,
                      kind: saveKind,
                      title: place.name,
                      subtitle: city.name,
                      href: `/nomad/${city.slug}`,
                    }}
                  />
                </div>
              ) : null}
              <h4>
                {place.url ? (
                  <a href={place.url} target="_blank" rel="noopener noreferrer">
                    {place.name}
                  </a>
                ) : (
                  place.name
                )}
              </h4>
              {place.area ? <p className="station-meta">{place.area}</p> : null}
              {place.note ? <p>{place.note}</p> : null}
            </article>
          ))}
        </div>
      )}
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
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}
