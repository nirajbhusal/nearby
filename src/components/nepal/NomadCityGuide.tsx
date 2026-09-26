"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SiteLink as Link } from "@/components/SiteLink";
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
        <h1 className="font-display page-title">{city.shortName}</h1>
        {city.headline ? <p className="lede">{city.headline}</p> : null}
      </header>

      <p className="ref-line">
        {city.referenceLine}
        {city.sourceUrl ? (
          <>
            {" "}
            <a href={city.sourceUrl} target="_blank" rel="noopener noreferrer">
              Nomads.com
            </a>
          </>
        ) : null}
      </p>

      <section className="nomad-section">
        <h2>Best areas to live</h2>
        <p className="section-lead">Swipe the areas. Show stays to filter the list.</p>
        {city.areas.length === 0 ? (
          <p className="empty-inline">Areas are not listed yet.</p>
        ) : (
          <div className="area-carousel">
            {city.areas.map((area) => {
              const on = area.name === areaName;
              return (
                <article key={area.name} className={on ? "area-card is-on" : "area-card"}>
                  <h3>{area.name}</h3>
                  {area.blurb ? <p>{area.blurb}</p> : null}
                  {area.tags.length > 0 ? (
                    <ul className="connector-chips">
                      {area.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                  <button type="button" className="btn-secondary" aria-pressed={on} onClick={() => chooseArea(area.name)}>
                    {on ? "Showing this area" : "Show stays here"}
                  </button>
                  {area.sources.length > 0 ? (
                    <details className="source-disclosure">
                      <summary>Sources</summary>
                      <ul>
                        {area.sources.map((url) => (
                          <li key={url}>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              {sourceLabel(url)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="nomad-section">
        <h2>Places to stay</h2>
        <p className="section-lead">{areaName ? `In ${areaName}.` : `${stays.length} verified stays.`}</p>
        {stays.length === 0 ? (
          <p className="empty-inline">No verified stays are listed for this area.</p>
        ) : (
          <StayPage stays={stays} citySlug={city.slug} cityName={city.shortName} />
        )}
      </section>

      <section className="nomad-section">
        <h2>Work nearby</h2>
        <p className="section-lead">
          {areaName ? `In ${areaName}.` : `${coworking.length} coworking spaces, ${cafes.length} cafés.`}
        </p>
        <PlaceList title="Coworking" places={coworking} city={city} saveKind="cowork" />
        <PlaceList title="Cafés" places={cafes} city={city} />
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
            {unmapped} stay{unmapped === 1 ? "" : "s"} {unmapped === 1 ? "has" : "have"} no map point.
          </p>
        ) : null}
        {pins.length > 0 ? (
          <NomadMapSlot pins={pins} />
        ) : (
          <p className="empty-inline nomad-map-empty">No mapped points for the layers that are on.</p>
        )}
        {city.osmCredit ? <p className="fine">{city.osmCredit}</p> : null}
      </section>

      <NoteDisclosure title="Visa and stay" notes={city.visa}>
        <p>
          Rules change. Check the{" "}
          <a href="https://www.immigration.gov.np/visa-information" target="_blank" rel="noopener noreferrer">
            Department of Immigration
          </a>{" "}
          before you travel.
        </p>
      </NoteDisclosure>
      <NoteDisclosure title="SIM and data" notes={city.sim} />
      <NoteDisclosure title="Season" notes={city.season} />
      <NoteDisclosure title="Practical tips" notes={city.tips} />

      <section className="nomad-section">
        <div className="link-row">
          <Link className="btn-primary" href={`/charge?q=${encodeURIComponent(city.shortName)}`}>
            Charge
          </Link>
          <Link className="btn-secondary" href={`/events?q=${encodeURIComponent(city.shortName)}`}>
            Events
          </Link>
          <Link className="btn-secondary" href={`/jobs?q=${encodeURIComponent(city.shortName)}`}>
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

function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LayerButton({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={on ? "chip chip-on" : "chip"} aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  );
}

function StayPage({
  stays,
  citySlug,
  cityName,
}: {
  stays: NomadStay[];
  citySlug: string;
  cityName: string;
}) {
  const page = 8;
  const [limit, setLimit] = useState(page);
  const key = stays.map((place) => place.id).join("|");
  useEffect(() => {
    setLimit(page);
  }, [key]);
  const shown = stays.slice(0, limit);
  return (
    <>
      <div className="stay-grid">
        {shown.map((place) => (
          <StayCard key={place.id} citySlug={citySlug} cityName={cityName} place={place} />
        ))}
      </div>
      {limit < stays.length ? (
        <button type="button" className="chip show-more" onClick={() => setLimit((value) => value + page)}>
          Show {Math.min(page, stays.length - limit)} more
        </button>
      ) : null}
    </>
  );
}

function StayCard({ place, citySlug, cityName }: { place: NomadStay; citySlug: string; cityName: string }) {
  const chips = place.features.slice(0, 3);
  return (
    <article className="stay-card">
      <h3>{place.name}</h3>
      <p className="card-sub">{[stayTypeLabel(place.type), place.area || cityName].filter(Boolean).join(" · ")}</p>
      <div className="meta-row">
        {place.priceShort ? <span className="meta-chip tabular">{place.priceShort}</span> : null}
        {chips.map((feature) => (
          <span key={feature} className="meta-chip">
            {feature}
          </span>
        ))}
      </div>
      {place.workLine ? <p className="card-sub">{place.workLine}</p> : null}
      <div className="card-footer">
        {place.website ? (
          <a className="btn-secondary card-action" href={place.website} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        ) : null}
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
      <details className="stay-more">
        <summary>Details</summary>
        {place.address ? <p>{place.address}</p> : null}
        {place.price && place.price !== place.priceShort ? <p>{place.price}</p> : null}
        {place.features.length > 3 ? (
          <ul className="connector-chips">
            {place.features.slice(3).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        ) : null}
        {place.nearbyWork.length > 0 ? (
          <ul className="work-distances">
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
        ) : null}
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
      </details>
    </article>
  );
}

function PlaceList({
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
        <ul className="work-list">
          {ordered.map((place) => (
            <li key={place.id}>
              {saveKind ? (
                <SaveButton
                  item={{
                    id: place.id,
                    kind: saveKind,
                    title: place.name,
                    subtitle: city.shortName,
                    href: `/nomad/${city.slug}`,
                  }}
                />
              ) : null}
              <span>
                {place.url ? (
                  <a href={place.url} target="_blank" rel="noopener noreferrer">
                    {place.name}
                  </a>
                ) : (
                  place.name
                )}
                {place.area ? <small>{place.area}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteDisclosure({
  title,
  notes,
  children,
}: {
  title: string;
  notes: NomadNote[];
  children?: ReactNode;
}) {
  if (notes.length === 0 && !children) return null;
  return (
    <details className="nomad-disclosure">
      <summary>{title}</summary>
      <ul>
        {notes.map((note) => (
          <li key={note.title}>
            <strong>{note.title}</strong>
            <p>{note.body}</p>
          </li>
        ))}
      </ul>
      {children}
    </details>
  );
}
