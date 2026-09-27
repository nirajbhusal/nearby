"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SceneArt } from "@/components/illustrations/Scenes";
import { DirectionsLink } from "@/components/nepal/NavigateLinks";
import { SiteLink as Link } from "@/components/SiteLink";
import { DistanceText } from "@/components/DistanceText";
import { NomadMapSlot } from "@/components/nepal/NomadMapSlot";
import { DetailSheet } from "@/components/motion/DetailSheet";
import { SwipeRow } from "@/components/motion/SwipeRow";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { stayHref, workHref } from "@/lib/item-link";
import {
  mappedWork,
  stayInArea,
  stayTypeLabel,
  workInArea,
  type NomadCity,
  type NomadNote,
  type NomadStay,
  type NomadWorkPlace,
} from "@/lib/nepal/nomad-shared";

type Layer = "stay" | "cowork" | "cafe";

export function NomadCityGuide({
  city,
  stayId = null,
  workId = null,
}: {
  city: NomadCity;
  stayId?: string | null;
  workId?: string | null;
}) {
  const [areaName, setAreaName] = useState<string | null>(null);
  const [asList, setAsList] = useState(false);
  const [closedFocus, setClosedFocus] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    stay: true,
    cowork: true,
    cafe: true,
  });
  const [showMap, setShowMap] = useState(false);
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

  const focusKey = stayId || workId || "";
  const focusedStay = stayId && closedFocus !== focusKey ? city.stays.find((place) => place.id === stayId) ?? null : null;
  const focusedWork =
    !focusedStay && workId && closedFocus !== focusKey ? city.coworking.find((place) => place.id === workId) ?? null : null;

  return (
    <main className={showMap ? "page-wrap nomad-guide is-map" : "page-wrap nomad-guide"}>
      <header className="city-hero">
        <div className="city-switch" role="group" aria-label="City">
          <Link href="/nomad/kathmandu" aria-current={city.slug === "kathmandu" ? "page" : undefined}>
            Kathmandu
          </Link>
          <Link href="/nomad/pokhara" aria-current={city.slug === "pokhara" ? "page" : undefined}>
            Pokhara
          </Link>
        </div>
        <div className="city-banner">
          <div className="section-hero-copy">
            <h1 className="font-display page-title">{city.shortName}</h1>
            {city.headline ? <p className="lede">{city.headline}</p> : null}
            <div className="seg city-view" role="group" aria-label="Guide view">
              <button type="button" aria-pressed={!showMap} onClick={() => setShowMap(false)}>
                Guide
              </button>
              <button type="button" aria-pressed={showMap} onClick={() => setShowMap(true)}>
                Map
              </button>
            </div>
          </div>
          <SceneArt scene={city.slug === "pokhara" ? "pokhara" : "kathmandu"} className="city-art" />
        </div>
      </header>

      <ul className="stat-grid">
        {statCells(city).map((stat) => (
          <li key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            {stat.source ? <small>{stat.source}</small> : null}
          </li>
        ))}
      </ul>
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
                <article key={area.name} className={on ? "area-card nomad-tile is-on" : "area-card nomad-tile"}>
                  <div className="tile-body">
                    <h3>{area.name}</h3>
                    {area.blurb ? <p className="tile-blurb">{brief(area.blurb)}</p> : null}
                    {area.tags.length > 0 ? (
                      <ul className="connector-chips">
                        {area.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="tile-actions">
                    {area.lat != null && area.lng != null ? (
                      <DirectionsLink compact lat={area.lat} lng={area.lng} name={area.name} />
                    ) : null}
                    <button type="button" className={on ? "text-btn is-on" : "text-btn"} aria-pressed={on} onClick={() => chooseArea(area.name)}>
                      {on ? "Showing stays" : "Show stays"}
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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="nomad-section">
        <div className="block-head">
          <h2>Stays</h2>
          <div className="seg" role="group" aria-label="List layout">
            <button type="button" aria-pressed={!asList} onClick={() => setAsList(false)}>
              Cards
            </button>
            <button type="button" aria-pressed={asList} onClick={() => setAsList(true)}>
              List
            </button>
          </div>
        </div>
        <p className="section-lead">{areaName ? `In ${areaName}.` : `${stays.length} verified stays.`}</p>
        {stays.length === 0 ? (
          <p className="empty-inline">No verified stays are listed for this area.</p>
        ) : (
          <StayPage stays={stays} citySlug={city.slug} cityName={city.shortName} asList={asList} />
        )}
      </section>

      <section className="nomad-section">
        <h2>Coworking</h2>
        <p className="section-lead">{areaName ? `In ${areaName}.` : `${coworking.length} verified spaces.`}</p>
        <PlaceCarousel places={coworking} city={city} saveKind="cowork" asList={asList} />
      </section>
      <section className="nomad-section">
        <h2>Cafés</h2>
        <p className="section-lead">{areaName ? `In ${areaName}.` : `${cafes.length} places to work from.`}</p>
        <PlaceCarousel places={cafes} city={city} />
      </section>

      <section className={showMap ? "nomad-section nomad-map-open" : "nomad-section"} id="nomad-map">
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
      {focusedStay ? (
        <DetailSheet title={focusedStay.name} onClose={() => setClosedFocus(focusKey)}>
          <h2>{focusedStay.name}</h2>
          <p className="card-sub">{focusedStay.area || city.shortName}</p>
          {focusedStay.priceShort ? <p>{focusedStay.priceShort}</p> : null}
          <div className="card-footer">
            <SaveButton
              item={{
                id: focusedStay.id,
                kind: "stay",
                title: focusedStay.name,
                subtitle: city.shortName,
                href: stayHref(city.slug, focusedStay.id),
              }}
            />
            <ShareButton title={focusedStay.name} text={focusedStay.name} url={stayHref(city.slug, focusedStay.id)} />
          </div>
        </DetailSheet>
      ) : null}
      {focusedWork ? (
        <DetailSheet title={focusedWork.name} onClose={() => setClosedFocus(focusKey)}>
          <h2>{focusedWork.name}</h2>
          <p className="card-sub">{focusedWork.area || city.shortName}</p>
          <div className="card-footer">
            <SaveButton
              item={{
                id: focusedWork.id,
                kind: "cowork",
                title: focusedWork.name,
                subtitle: city.shortName,
                href: workHref(city.slug, focusedWork.id),
              }}
            />
            <ShareButton title={focusedWork.name} text={focusedWork.name} url={workHref(city.slug, focusedWork.id)} />
          </div>
        </DetailSheet>
      ) : null}
    </main>
  );
}

function brief(body: string): string {
  const sentence = body.split(/(?<=\.)\s/)[0] ?? body;
  return sentence.length > 96 ? `${sentence.slice(0, 93)}…` : sentence;
}

function monogram(name: string): string {
  const parts = name.split(/\s+/).filter((part) => /[A-Za-z]/.test(part[0] ?? ""));
  const letters = (parts.length > 1 ? parts.slice(0, 2) : [name]).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("").slice(0, 2) || "•";
}

function statCells(city: NomadCity): { label: string; value: string; source: ReactNode }[] {
  const cost = city.reference.find((stat) => /cost/i.test(stat.label));
  const internet = city.reference.find((stat) => /internet/i.test(stat.label));
  const cells: { label: string; value: string; source: ReactNode }[] = [];
  if (cost && city.costLabel) {
    const sourceLine = `Nomads.com · ${city.asOfLabel}`;
    cells.push({
      label: "Cost per month",
      value: city.costLabel,
      source: city.sourceUrl ? (
        <a href={city.sourceUrl} target="_blank" rel="noopener noreferrer">
          {sourceLine}
        </a>
      ) : (
        sourceLine
      ),
    });
  }
  if (internet) cells.push({ label: "Internet", value: internet.value, source: city.internetQuality });
  if (city.visa[0]) cells.push({ label: "Visa", value: city.visa[0].title, source: null });
  if (city.seasonLabel) cells.push({ label: "Best season", value: city.seasonLabel, source: null });
  return cells;
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
  asList,
}: {
  stays: NomadStay[];
  citySlug: string;
  cityName: string;
  asList: boolean;
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
      <div className={asList ? "card-list nomad-stack" : "nomad-carousel"}>
        {shown.map((place) => (
          <StayCard key={place.id} citySlug={citySlug} cityName={cityName} place={place} swipe={asList} />
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

function StayCard({
  place,
  citySlug,
  cityName,
  swipe,
}: {
  place: NomadStay;
  citySlug: string;
  cityName: string;
  swipe: boolean;
}) {
  const chips = place.features.slice(0, 3);
  const href = stayHref(citySlug, place.id);
  const saved = {
    id: place.id,
    kind: "stay" as const,
    title: place.name,
    subtitle: cityName,
    href,
  };
  const card = (
    <article className="stay-card nomad-tile">
      <div className="tile-body">
        <div className="tile-title">
          <span className="monogram" aria-hidden>
            {monogram(place.name)}
          </span>
          <div>
            <h3>{place.name}</h3>
            <p className="card-sub">{place.area || cityName}</p>
          </div>
        </div>
        <p className="tile-fact">{place.priceShort || stayTypeLabel(place.type)}</p>
        {chips.length > 0 ? (
          <div className="meta-row">
            {chips.map((feature) => (
              <span key={feature} className="meta-chip">
                {feature}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="tile-actions">
        {place.lat != null && place.lng != null ? <DirectionsLink compact lat={place.lat} lng={place.lng} name={place.name} /> : null}
        {place.website ? (
          <a className="text-btn" href={place.website} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        ) : null}
        <SaveButton item={saved} />
        <ShareButton title={place.name} text={place.name} url={href} />
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
      </div>
    </article>
  );
  if (!swipe) return card;
  return (
    <SwipeRow item={saved} share={{ title: place.name, text: place.name, url: href }}>
      {card}
    </SwipeRow>
  );
}

function PlaceCarousel({
  places,
  city,
  saveKind,
  asList = false,
}: {
  places: NomadWorkPlace[];
  city: NomadCity;
  saveKind?: "cowork";
  asList?: boolean;
}) {
  const ordered = [...places].sort((a, b) => a.name.localeCompare(b.name));
  if (ordered.length === 0) return <p className="empty-inline">Not listed for this area.</p>;
  return (
    <div className={asList ? "card-list nomad-stack" : "nomad-carousel"}>
      {ordered.map((place) => {
        const href = saveKind ? workHref(city.slug, place.id) : `/nomad/${city.slug}`;
        const saved = saveKind
          ? { id: place.id, kind: saveKind, title: place.name, subtitle: city.shortName, href }
          : null;
        const card = (
        <article key={place.id} className="nomad-tile">
          <div className="tile-body">
            <div className="tile-title">
              <span className="monogram" aria-hidden>
                {monogram(place.name)}
              </span>
              <div>
                <h3>{place.name}</h3>
                <p className="card-sub">{place.area || city.shortName}</p>
              </div>
            </div>
          </div>
          <div className="tile-actions">
            {place.lat != null && place.lng != null ? (
              <DirectionsLink compact lat={place.lat} lng={place.lng} name={place.name} />
            ) : null}
            {place.url ? (
              <a className="text-btn" href={place.url} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            ) : null}
            {saved ? <SaveButton item={saved} /> : null}
            {saved ? <ShareButton title={place.name} text={place.name} url={href} /> : null}
          </div>
        </article>
        );
        if (!asList || !saved) return card;
        return (
          <SwipeRow key={place.id} item={saved} share={{ title: place.name, text: place.name, url: href }}>
            {card}
          </SwipeRow>
        );
      })}
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
