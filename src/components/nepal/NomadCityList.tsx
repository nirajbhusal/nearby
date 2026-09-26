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
          <h2>{city.shortName}</h2>
          <p>{city.referenceLine}</p>
        </Link>
      ))}
    </div>
  );
}
