"use client";

import { SiteLink as Link } from "@/components/SiteLink";
import { useProfile } from "@/lib/profile-store";
import { NOMAD_INDEX } from "@/lib/nepal/nomad-shared";

export function NomadCityList() {
  const profile = useProfile();
  const home = profile.homeCity?.toLowerCase() ?? "";
  const cities = [...NOMAD_INDEX].sort((a, b) => {
    const aHome = a.name.toLowerCase() === home || a.slug === home ? 0 : 1;
    const bHome = b.name.toLowerCase() === home || b.slug === home ? 0 : 1;
    return aHome - bHome;
  });

  return (
    <div className="entry-grid">
      {cities.map((city) => (
        <Link key={city.slug} href={`/nomad/${city.slug}`} className="app-card entry-card">
          <h2>{city.shortName}</h2>
          <p>{city.headline}</p>
        </Link>
      ))}
    </div>
  );
}
