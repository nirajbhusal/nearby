import { SiteLink as Link } from "@/components/SiteLink";
import { BookOpen, Briefcase, Calendar, Compass, Info, Zap } from "lucide-react";
import { HomeSearch } from "@/components/home/HomeSearch";
import { NepalMapSlot } from "@/components/home/NepalMapSlot";
import { NearestChargers, type HomeCharger } from "@/components/home/NearestChargers";
import { LogoMark } from "@/components/brand/Logo";
import { DayGreeting } from "@/components/home/DayGreeting";
import { formatWhen } from "@/lib/nepal/format";
import { evIndex, stationsInScope } from "@/lib/nepal/ev";
import { nepalEvents, eventTiming, eventsNear } from "@/lib/nepal/events";
import { companiesNear, nepalCompanies } from "@/lib/nepal/jobs";
import { learnPlaces } from "@/lib/nepal/learn";
import { nomadCities } from "@/lib/nepal/nomad";
import { KATHMANDU } from "@/lib/nepal/places";
import { provinceRecords } from "@/lib/nepal/provinces";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Nearby · All within reach",
  "Chargers, tech jobs, events and places to learn in Nepal.",
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
        <DayGreeting />
        <h1 className="font-display hero-title">Everything near you, in one place.</h1>
        <p className="lede">Chargers, tech jobs, events and places to learn.</p>
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
        <Link href="/jobs?q=Kathmandu" className="section-card" prefetch={false}>
          <Briefcase aria-hidden />
          <h2>Jobs</h2>
          <p>Tech companies and open roles around a city.</p>
        </Link>
        <Link href="/events?q=Kathmandu" className="section-card" prefetch={false}>
          <Calendar aria-hidden />
          <h2>Events</h2>
          <p>Meetups, conferences, and the series that repeat.</p>
        </Link>
        <Link href="/learn?q=Kathmandu" className="section-card" prefetch={false}>
          <BookOpen aria-hidden />
          <h2>Learn</h2>
          <p>Universities, bootcamps, and AI communities.</p>
        </Link>
        <Link href="/nomad" className="section-card" prefetch={false}>
          <Compass aria-hidden />
          <h2>Nomad</h2>
          <p>Kathmandu and Pokhara, for living and working.</p>
        </Link>
        <Link href="/about" className="section-card" prefetch={false}>
          <Info aria-hidden />
          <h2>About</h2>
          <p>Sources, and how Nearby is put together.</p>
        </Link>
      </section>

      <div className="home-split">
        <NearestChargers fallback={fallback} />
        <section className="nepal-card" aria-label="Chargers">
          <div className="block-head">
            <h2>{chargers} chargers</h2>
            <Link href="/charge?near=1">Near me</Link>
          </div>
          <NepalMapSlot provinces={provinceRecords} />
          <ul className="province-counts">
            {provinceRecords.map((province) => (
              <li key={province.slug}>
                <Link href={`/charge?province=${province.slug}`}>
                  <span>{province.name}</span>
                  <strong>{province.count}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="home-block">
        <div className="block-head">
          <h2>Coming up</h2>
          <Link href="/events?q=Kathmandu" prefetch={false}>All events</Link>
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
          <Link href="/jobs?q=Kathmandu" prefetch={false}>All jobs</Link>
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
          <Link href="/nomad" prefetch={false}>Both cities</Link>
        </div>
        <div className="nomad-promo">
          {nomadCities.map((city) => {
            return (
              <Link key={city.slug} href={`/nomad/${city.slug}`} className="promo-card" prefetch={false}>
                <Compass size={18} aria-hidden />
                <h3>{city.shortName}</h3>
                <p>{city.referenceLine}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="home-mark">
        <LogoMark className="logo-mark" />
        Curated · 26 Sep 2026
      </p>
    </main>
  );
}
