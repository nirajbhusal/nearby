import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNomadCity,
  nomadCities,
  type NomadNote,
  type NomadPlace,
  type NomadStat,
} from "@/lib/nepal/nomad";

export const dynamicParams = false;

export function generateStaticParams() {
  return nomadCities.map((city) => ({ city: city.slug }));
}

type Params = Promise<{ city: string }>;

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
    description: `Digital nomad notes for ${city.name}, Nepal. Figures include a source and an as-of date.`,
  };
}

export default async function NomadCityPage({ params }: { params: Params }) {
  const { city: slug } = await params;
  const city = getNomadCity(slug);
  if (!city) notFound();

  const internet = city.internet;
  const season = city.bestSeason;

  return (
    <main className="page-wrap">
      <header className="page-hero">
        <p className="eyebrow">Nomad · {city.province}</p>
        <h1 className="font-display page-title">{city.name}</h1>
        <p className="lede">
          A practical page for working from {city.name}. Numbers appear only
          when a source and an as-of date came with them.
        </p>
      </header>

      <section className="stat-row" aria-label="City figures">
        {city.stats.map((stat) => (
          <StatCell key={stat.id} stat={stat} />
        ))}
        <article className="stat-cell">
          <p className="meta-label">Internet</p>
          <p className="stat-value">{internet ? internet.value : "Not listed yet"}</p>
          {internet ? <Attribution stat={internet} /> : null}
        </article>
        <article className="stat-cell">
          <p className="meta-label">Best season</p>
          <p className="stat-value">{season ? season.body : "Not listed yet"}</p>
          {season ? <Attribution stat={season} /> : null}
        </article>
      </section>

      <PlaceSection title="Coworking spaces" places={city.coworking} />
      <PlaceSection title="Laptop-friendly cafés" places={city.cafes} />
      <PlaceSection title="Neighbourhoods to stay" places={city.neighbourhoods} />
      <NoteSection title="Visa and stay" note={city.visa} empty="Visa and stay rules are not listed yet." />
      <NoteSection title="SIM and data" note={city.sim} empty="SIM and data notes are not listed yet." />
      <section className="nomad-section">
        <h2>Practical tips</h2>
        {city.tips.length === 0 ? (
          <p className="empty-inline">Practical tips are not listed yet.</p>
        ) : (
          <ul className="note-list">
            {city.tips.map((tip) => (
              <li key={tip.title} className="app-card">
                <h3>{tip.title}</h3>
                <p>{tip.body}</p>
                <Attribution stat={tip} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="nomad-section">
        <h2>In {city.name}</h2>
        <div className="link-row">
          <Link className="btn-primary" href={`/charge?q=${encodeURIComponent(city.name)}`}>
            EV chargers
          </Link>
          <Link className="btn-secondary" href={`/jobs?q=${encodeURIComponent(city.name)}`}>
            Jobs
          </Link>
          <Link className="btn-secondary" href={`/events?q=${encodeURIComponent(city.name)}`}>
            Events
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
      <Attribution stat={stat} />
    </article>
  );
}

function Attribution({ stat }: { stat: { source: string; sourceUrl: string | null; asOf: string } }) {
  return (
    <p className="fine">
      Source:{" "}
      {stat.sourceUrl ? (
        <a href={stat.sourceUrl} target="_blank" rel="noopener noreferrer">
          {stat.source}
        </a>
      ) : (
        stat.source
      )}
      , as of {stat.asOf}
    </p>
  );
}

function PlaceSection({ title, places }: { title: string; places: NomadPlace[] }) {
  return (
    <section className="nomad-section">
      <h2>{title}</h2>
      {places.length === 0 ? (
        <p className="empty-inline">Not listed yet. Verified places will show here with a source and a date.</p>
      ) : (
        <ul className="card-list">
          {places.map((place) => (
            <li key={place.name} className="app-card">
              <h3>{place.url ? <a href={place.url}>{place.name}</a> : place.name}</h3>
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
  note,
  empty,
}: {
  title: string;
  note: NomadNote | null;
  empty: string;
}) {
  return (
    <section className="nomad-section">
      <h2>{title}</h2>
      {note ? (
        <article className="app-card">
          <h3>{note.title}</h3>
          <p>{note.body}</p>
          <Attribution stat={note} />
        </article>
      ) : (
        <p className="empty-inline">{empty}</p>
      )}
    </section>
  );
}
