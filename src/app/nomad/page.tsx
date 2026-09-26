import type { Metadata } from "next";
import Link from "next/link";
import { nomadCities } from "@/lib/nepal/nomad";

export const metadata: Metadata = {
  title: "Digital nomad — Nearby",
  description:
    "Kathmandu and Pokhara for people working from Nepal. Rank and cost figures are credited to Nomads.com.",
};

export default function NomadIndexPage() {
  return (
    <main className="page-wrap">
      <header className="page-hero">
        <p className="eyebrow">Nomad</p>
        <h1 className="font-display page-title">Work from Nepal</h1>
        <p className="lede">
          A city guide for people spending a month with a laptop. Every figure
          on these pages names its source and the date it was current. Sections
          without a verified source stay empty on purpose.
        </p>
      </header>
      <div className="entry-grid">
        {nomadCities.map((city) => (
          <Link key={city.slug} href={`/nomad/${city.slug}`} className="app-card entry-card">
            <h2>{city.name}</h2>
            <p>{city.province}</p>
            <ul className="mini-stats">
              {city.stats.map((stat) => (
                <li key={stat.id}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </main>
  );
}
