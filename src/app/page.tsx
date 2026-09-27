import { LogoMark } from "@/components/brand/Logo";
import { AskNearby, PromptCard } from "@/components/home/AskNearby";
import { toHref } from "@/components/SiteLink";
import { formatWhen } from "@/lib/nepal/format";
import { stationsInScope } from "@/lib/nepal/ev";
import { eventTiming, eventsNear, nepalEvents } from "@/lib/nepal/events";
import { companiesNear } from "@/lib/nepal/jobs";
import { KATHMANDU } from "@/lib/nepal/places";
import { SITE_TAGLINE, pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Nearby · All within reach",
  "Chargers, tech jobs, events and places to learn in Nepal.",
  "/",
);

export default function HomePage() {
  const now = new Date();
  const charger = stationsInScope(KATHMANDU, 25)[0];
  const jobs = companiesNear(KATHMANDU, { category: null, city: "Kathmandu", remoteOnly: false })
    .near.filter((row) => row.company.open_roles.length > 0)
    .slice(0, 2);
  const events = eventsNear(KATHMANDU, { type: null, freeOnly: false }, now).upcoming.slice(0, 2);
  const upcoming = nepalEvents.filter((event) => eventTiming(event, now) === "upcoming").length;

  return (
    <main className="home">
      <section className="start-screen">
        <LogoMark className="logo-mark start-logo" />
        <p className="brand-tag">{SITE_TAGLINE}</p>
        <h1 className="font-display hero-title">Everything near you, in one place.</h1>
        <AskNearby />
        <div className="prompt-grid">
          <PromptCard href="/charge?near=1&fast=1" title="Fast chargers near me" scene="charge" />
          <PromptCard href="/jobs?q=Kathmandu&category=ai-data" title="AI jobs in Kathmandu" scene="jobs" />
          <PromptCard href="/events?q=Kathmandu&when=week" title="Events this week" scene="events" />
          <PromptCard href="/nomad/pokhara" title="Coworking in Pokhara" scene="pokhara" />
          <PromptCard href="/learn?q=Kathmandu" title="Learn AI nearby" scene="learn" />
        </div>
      </section>

      <section className="home-block">
        <div className="block-head">
          <h2>Nearby now</h2>
          <span className="fine">{upcoming} upcoming</span>
        </div>
        <ul className="now-list">
          {charger ? (
            <li>
              <a href={toHref(`/ev/${charger.id}`)}>
                <span>Charger</span>
                <strong>{charger.name}</strong>
                <small>{[charger.city, charger.speed].filter(Boolean).join(" · ")}</small>
              </a>
            </li>
          ) : null}
          {jobs.map((row) => (
            <li key={row.company.slug}>
              <a href={toHref("/jobs?q=Kathmandu")}>
                <span>Job</span>
                <strong>{row.company.open_roles[0]?.title || row.company.name}</strong>
                <small>
                  {row.company.name}
                  {row.company.open_roles[0] ? "" : ""}
                  {" · "}
                  {row.placeLabel}
                </small>
              </a>
            </li>
          ))}
          {events.map((row) => (
            <li key={row.event.id}>
              <a href={toHref("/events?q=Kathmandu")}>
                <span>Event</span>
                <strong>{row.event.title}</strong>
                <small>
                  {row.event.start_date ? formatWhen(row.event.start_date, row.event.end_date) : "Date not set"}
                  {row.event.city ? ` · ${row.event.city}` : ""}
                </small>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
