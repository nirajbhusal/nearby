import Link from "next/link";
import { BookOpen, Briefcase, Calendar, Compass, Zap } from "lucide-react";
import { HomeSearch } from "@/components/home/HomeSearch";
import { NearestChargers, type HomeCharger } from "@/components/home/NearestChargers";
import { LogoMark } from "@/components/brand/Logo";
import { formatKm, formatWhen, speedLabel } from "@/lib/nepal/format";
import { evIndex, stationsInScope } from "@/lib/nepal/ev";
import { nepalEvents, eventTiming, eventsNear } from "@/lib/nepal/events";
import { companiesNear, nepalCompanies } from "@/lib/nepal/jobs";
import { learnPlaces } from "@/lib/nepal/learn";
import { nomadCities } from "@/lib/nepal/nomad";
import { KATHMANDU } from "@/lib/nepal/places";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Nearby — EV charging in Nepal",
  "Find, check, and navigate to EV chargers in Nepal. Tech jobs, events, and a digital nomad guide sit beside the map.",
  "/",
);

export default function HomePage() {
  const now = new Date();
  const chargers = evIndex.length;
  const roles = nepalCompanies.reduce((sum, company) => sum + company.open_roles.length, 0);
  const upcomingCount = nepalEvents.filter((event) => eventTiming(event, now) === "upcoming").length;
  const programs = learnPlaces.length;
  const fallback: HomeCharger[] = stationsInScope(KATHMANDU, 25)
    .slice(0, 4)
    .map((station) => ({
      id: station.id,
      name: station.name,
      city: station.city,
      speed: station.speed,
      distanceKm: station.distanceKm,
    }));
  const upcoming = eventsNear(KATHMANDU, { type: null, freeOnly: false }, now).upcoming.slice(0, 3);
  const jobs = companiesNear(KATHMANDU, { category: null, city: "Kathmandu", remoteOnly: false })
    .near.filter((row) => row.company.open_roles.length > 0)
    .slice(0, 3);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="hero-mesh" aria-hidden>
          <svg viewBox="0 0 400 160" preserveAspectRatio="none">
            <path d="M0 120 L40 96 L78 108 L120 70 L168 92 L210 48 L258 86 L310 54 L352 88 L400 60 L400 160 L0 160 Z" />
            <path d="M0 138 L60 118 L110 128 L170 100 L230 122 L290 96 L360 116 L400 104 L400 160 L0 160 Z" />
          </svg>
        </div>
        <p className="eyebrow">Nepal</p>
        <h1 className="font-display hero-title">Find it nearby.</h1>
        <p className="lede">
          A map of EV chargers, plus tech jobs, events, and a nomad guide for Kathmandu and Pokhara.
        </p>
        <HomeSearch />
        <div className="hero-actions">
          <Link href="/charge?near=1" className="btn-primary">
            <Zap size={18} aria-hidden />
            Find a charger near me
          </Link>
        </div>
        <ul className="count-row" aria-label="What’s in Nearby">
          <li><strong>{chargers}</strong><span>Chargers</span></li>
          <li><strong>{roles}</strong><span>Open roles</span></li>
          <li><strong>{upcomingCount}</strong><span>Upcoming events</span></li>
          <li><strong>{programs}</strong><span>Places to learn</span></li>
        </ul>
      </section>

      <section className="section-cards" aria-label="Sections">
        <Link href="/charge" className="section-card">
          <Zap aria-hidden />
          <h2>Charge</h2>
          <p>Speed-coloured pins, filters, and a navigate button.</p>
        </Link>
        <Link href="/jobs?q=Kathmandu" className="section-card">
          <Briefcase aria-hidden />
          <h2>Jobs</h2>
          <p>Tech companies and open roles around a city.</p>
        </Link>
        <Link href="/events?q=Kathmandu" className="section-card">
          <Calendar aria-hidden />
          <h2>Events</h2>
          <p>Meetups, conferences, and the series that repeat.</p>
        </Link>
        <Link href="/learn?q=Kathmandu" className="section-card">
          <BookOpen aria-hidden />
          <h2>Learn</h2>
          <p>Universities, bootcamps, and AI communities.</p>
        </Link>
      </section>

      <div className="home-split">
        <NearestChargers fallback={fallback} />
        <Link href="/charge?q=Kathmandu" className="map-preview" aria-label="Open the Kathmandu charger map">
          <svg viewBox="0 0 280 180" aria-hidden>
            <rect width="280" height="180" rx="20" />
            <path d="M20 40 H260 M20 80 H260 M20 120 H260 M70 16 V164 M140 16 V164 M210 16 V164" />
            <circle cx="92" cy="68" r="7" className="pin-fast" />
            <circle cx="168" cy="104" r="7" className="pin-fast" />
            <circle cx="206" cy="58" r="6" className="pin-slow" />
            <circle cx="124" cy="128" r="5" className="pin-unknown" />
          </svg>
          <span>
            <strong>Kathmandu map</strong>
            <small>{fallback.length > 0 ? `${speedLabel(fallback[0].speed)} nearby · ${formatKm(fallback[0].distanceKm)}` : "Open the charger map"}</small>
          </span>
        </Link>
      </div>

      <section className="home-block">
        <div className="block-head">
          <h2>Coming up</h2>
          <Link href="/events?q=Kathmandu">All events</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="empty-inline">No dated events are coming up near Kathmandu.</p>
        ) : (
          <ul className="preview-list">
            {upcoming.map((row) => (
              <li key={row.event.id} className="preview-card">
                <time dateTime={row.event.start_date ?? undefined}>
                  {row.event.start_date ? formatWhen(row.event.start_date, row.event.end_date) : "Date not set"}
                </time>
                <strong>{row.event.title}</strong>
                <small>{[row.event.city, row.event.organizer].filter(Boolean).join(" · ")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-block">
        <div className="block-head">
          <h2>Featured jobs</h2>
          <Link href="/jobs?q=Kathmandu">All jobs</Link>
        </div>
        <ul className="preview-list">
          {jobs.map((row) => (
            <li key={row.company.slug} className="preview-card">
              <strong>{row.company.name}</strong>
              <small>
                {row.company.open_roles.length} open role{row.company.open_roles.length === 1 ? "" : "s"}
                {row.company.open_roles[0] ? ` · ${row.company.open_roles[0].title}` : ""}
              </small>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-block">
        <div className="block-head">
          <h2>Digital nomad</h2>
          <Link href="/nomad">Both cities</Link>
        </div>
        <div className="nomad-promo">
          {nomadCities.map((city) => {
            const rank = city.stats.find((stat) => stat.id === "rank");
            const cost = city.stats.find((stat) => stat.id === "cost");
            return (
              <Link key={city.slug} href={`/nomad/${city.slug}`} className="promo-card">
                <Compass size={18} aria-hidden />
                <h3>{city.name}</h3>
                <p>{rank?.value} · {cost?.value}</p>
                <small>Source: Nomads.com, as of {rank?.asOf}. Ranking changes daily.</small>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="home-mark">
        <LogoMark className="logo-mark" />
        Curated for Nepal · 26 Sep 2026
      </p>
    </main>
  );
}
