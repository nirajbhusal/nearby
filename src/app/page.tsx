import Link from "next/link";
import { CityHorizon } from "@/components/illustrations/CityHorizon";

const ENTRIES = [
  {
    href: "/charge",
    title: "Charge",
    text: "A map of EV chargers across Nepal. Filter by speed and plug, then navigate.",
  },
  {
    href: "/jobs?q=Kathmandu",
    title: "Jobs",
    text: "Tech companies and open roles, sorted around the city you pick.",
  },
  {
    href: "/learn?q=Kathmandu",
    title: "Learn",
    text: "Universities, bootcamps, and communities teaching AI in Nepal.",
  },
  {
    href: "/events?q=Kathmandu",
    title: "Events",
    text: "Meetups, conferences, and the series that happen on a regular rhythm.",
  },
  {
    href: "/nomad/kathmandu",
    title: "Nomad",
    text: "Kathmandu and Pokhara for people working from Nepal. Figures stay sourced.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="page-wrap home-wrap">
      <section className="hero">
        <p className="eyebrow">Nepal</p>
        <h1 className="font-display hero-title">Find a charger. Check it. Go.</h1>
        <p className="lede">
          Nearby is built for EV drivers in Nepal — a full map, a short list, and a
          navigate button you can hit with one hand. Jobs, learning, events, and a
          nomad guide sit beside it.
        </p>
        <div className="hero-actions">
          <Link href="/charge?near=1" className="btn-primary">
            Find a charger near me
          </Link>
          <Link href="/charge?q=Kathmandu" className="btn-secondary">
            Open the Kathmandu map
          </Link>
        </div>
        <CityHorizon className="hero-sketch" />
      </section>
      <section className="entry-grid" aria-label="Sections">
        {ENTRIES.map((entry) => (
          <Link key={entry.href} href={entry.href} className="app-card entry-card">
            <h2>{entry.title}</h2>
            <p>{entry.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
