"use client";

import Link from "next/link";
import { useProfile } from "@/lib/profile-store";
import { nomadCities } from "@/lib/nepal/nomad";

export function NomadCityList() {
  const profile = useProfile();
  const home = profile.homeCity?.toLowerCase() ?? "";
  const cities = [...nomadCities].sort((a, b) => {
    const aHome = a.name.toLowerCase() === home || a.slug === home ? 0 : 1;
    const bHome = b.name.toLowerCase() === home || b.slug === home ? 0 : 1;
    return aHome - bHome;
  });

  return (
    <div className="entry-grid">
      {cities.map((city) => (
        <Link key={city.slug} href={`/nomad/${city.slug}`} className="app-card entry-card">
          <h2>{city.name}</h2>
          <p>{city.province}</p>
          <ul className="mini-stats">
            {city.stats
              .filter((stat) => ["rank", "cost", "internet", "safety"].includes(stat.id))
              .map((stat) => (
                <li key={stat.id}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </li>
              ))}
          </ul>
          <p className="fine">Source: Nomads.com, as of 26 Sep 2026. The ranking changes daily.</p>
        </Link>
      ))}
    </div>
  );
}
