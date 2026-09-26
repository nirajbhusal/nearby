import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NomadMapSlot } from "@/components/nepal/NomadMapSlot";
import {
  getNomadCity,
  mappedPlaces,
  nomadCities,
  type NomadAttribution,
  type NomadBadge,
  type NomadNote,
  type NomadPlace,
  type NomadStat,
} from "@/lib/nepal/nomad";

export const dynamicParams = false;

export function generateStaticParams() {
  return nomadCities.map((city) => ({ city: city.slug }));
}

type Params = Promise<{ city: string }>;

const BADGE_LABEL: Record<NomadBadge, string> = {
  listed: "Listed; not confirmed",
  stale: "May be outdated",
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getNomadCity(slug);
  if (!city) return { title: "Nomad city — Nearby" };
  return {
    title: `${city.name} for nomads — Nearby`,
    description: `Digital nomad notes for ${city.name}, Nepal. Every figure includes a source and an as-of date.`,
  };
}

export default async function NomadCityPage({ params }: { params: Params }) {
  const { city: slug } = await params;
  const city = getNomadCity(slug);
  if (!city) notFound();

  const pins = mappedPlaces(city.coworking).map((place) => ({
    name: place.name,
    lat: place.lat,
    lng: place.lng,
  }));

  return (
    <main className="page-wrap">
      <header className="page-hero">
        <p className="eyebrow">Nomad · {city.province}</p>
        <h1 className="font-display page-title">{city.name}</h1>
        <p className="lede">{city.blurb}</p>
        <Attribution stat={city.blurbSource} />
      </header>

      <section className="stat-row" aria-label="City figures">
        {city.stats.map((stat) => (
          <StatCell key={stat.id} stat={stat} />
        ))}
      </section>

      <p className="fine nomad-ookla">
        <a href={city.ookla.url} target="_blank" rel="noopener noreferrer">
          {city.ookla.label}
        </a>
      </p>

      <NoteSection title="Season" notes={[city.season]} empty="Season notes are not listed yet." />

      <PlaceSection
        title="Coworking spaces"
        places={city.coworking}
        intro={
          pins.length > 0
            ? "Confirmed spaces come first. The map pins a space only when a coordinate was published with it."
            : "Confirmed spaces come first. None of these spaces has a published coordinate, so there is no map."
        }
        map={
          pins.length > 0 ? (
            <NomadMapSlot pins={pins} />
          ) : (
            <p className="empty-inline nomad-map-empty">No coworking map for this city yet.</p>
          )
        }
      />
      <PlaceSection
        title="Laptop-friendly cafés"
        places={city.cafes}
        intro="Current listings come first. A stale note keeps its older source date."
      />
      <PlaceSection title="Neighbourhoods" places={city.neighbourhoods} />

      <NoteSection title="Visa and stay" notes={city.visa} empty="Visa and stay rules are not listed yet.">
        <p className="fine nomad-caveat">
          Rules change. Check the{" "}
          <a
            href="https://www.immigration.gov.np/visa-information"
            target="_blank"
            rel="noopener noreferrer"
          >
            Department of Immigration
          </a>{" "}
          before you travel.
        </p>
      </NoteSection>

      <NoteSection title="SIM and data" notes={city.sim} empty="SIM and data notes are not listed yet." />

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

function StatCell({ stat }: { stat: NomadStat }) {
  return (
    <article className="stat-cell">
      <p className="meta-label">{stat.label}</p>
      <p className="stat-value">{stat.value}</p>
      {stat.note ? <p className="stat-note">{stat.note}</p> : null}
      <Attribution stat={stat} />
    </article>
  );
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

function PlaceSection({
  title,
  places,
  intro,
  map,
}: {
  title: string;
  places: NomadPlace[];
  intro?: string;
  map?: ReactNode;
}) {
  return (
    <section className="nomad-section">
      <h2>{title}</h2>
      {intro ? <p className="section-lead">{intro}</p> : null}
      {map}
      {places.length === 0 ? (
        <p className="empty-inline">Not listed yet. Verified places will show here with a source and a date.</p>
      ) : (
        <ul className="card-list nomad-cards">
          {places.map((place) => (
            <li key={place.name} className="app-card">
              <h3>
                {place.url ? (
                  <a href={place.url} target="_blank" rel="noopener noreferrer">
                    {place.name}
                  </a>
                ) : (
                  place.name
                )}
              </h3>
              {place.badges.length > 0 ? (
                <p className="badge-row">
                  {place.badges.map((badge) => (
                    <span key={badge} className={`badge badge-${badge}`}>
                      {BADGE_LABEL[badge]}
                    </span>
                  ))}
                </p>
              ) : null}
              {place.area ? <p className="station-meta">{place.area}</p> : null}
              {place.note ? <p>{place.note}</p> : null}
              <Attribution stat={place} />
            </li>
          ))}
        </ul>
      )}
    </section>
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
