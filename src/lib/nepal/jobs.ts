import {
  distanceKm,
  isNearRecord,
  isOnlinePlace,
  type Locatable,
} from "@/lib/nepal/places";
import type { NepalCompany, PlaceHit } from "@/lib/nepal/types";
import companiesJson from "@/data/nepal/companies.json";

export const nepalCompanies = companiesJson as NepalCompany[];

export type NearbyCompany = {
  company: NepalCompany;
  distanceKm: number | null;
  placeLabel: string;
  unlocated: boolean;
};

function nearestOffice(origin: PlaceHit, company: NepalCompany): {
  distanceKm: number | null;
  placeLabel: string;
  locatable: Locatable | null;
} {
  const offices = company.offices.filter((office) => office.city || office.lat != null);
  if (!offices.length) {
    return { distanceKm: null, placeLabel: "City not listed", locatable: null };
  }
  let best = offices[0];
  let bestDistance = distanceKm(origin, best);
  for (const office of offices.slice(1)) {
    const distance = distanceKm(origin, office);
    if (distance == null) continue;
    if (bestDistance == null || distance < bestDistance) {
      best = office;
      bestDistance = distance;
    }
  }
  const placeLabel =
    best.city && best.district && best.city !== best.district
      ? `${best.city}, ${best.district}`
      : best.city || best.district || "Nepal";
  return {
    distanceKm: bestDistance,
    placeLabel,
    locatable: best,
  };
}

export function companiesNear(
  origin: PlaceHit,
  options: {
    category: string | null;
    city: string | null;
    remoteOnly: boolean;
  }
): { near: NearbyCompany[]; unlocated: NearbyCompany[] } {
  const near: NearbyCompany[] = [];
  const unlocated: NearbyCompany[] = [];

  for (const company of nepalCompanies) {
    if (options.category && company.category !== options.category) continue;
    if (options.remoteOnly && company.remote_friendly !== true) continue;

    const office = nearestOffice(origin, company);
    const row: NearbyCompany = {
      company,
      distanceKm: office.distanceKm,
      placeLabel: office.placeLabel,
      unlocated: !office.locatable || office.locatable.lat == null,
    };

    if (!office.locatable || isOnlinePlace(office.locatable.city)) {
      unlocated.push(row);
      continue;
    }

    if (options.city) {
      const inCity = company.offices.some(
        (item) => item.city && item.city.toLowerCase() === options.city!.toLowerCase()
      );
      if (!inCity) continue;
    }

    const matches = company.offices.some((item) => isNearRecord(origin, item));
    if (!options.remoteOnly && !matches) continue;
    if (options.city && !company.offices.some((item) => item.city === options.city)) {
      continue;
    }
    near.push(row);
  }

  const byDistance = (a: NearbyCompany, b: NearbyCompany) => {
    const roles = Number(b.company.open_roles.length > 0) - Number(a.company.open_roles.length > 0);
    if (roles !== 0) return roles;
    if (a.distanceKm == null && b.distanceKm == null) {
      return a.company.name.localeCompare(b.company.name);
    }
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm || a.company.name.localeCompare(b.company.name);
  };

  near.sort(byDistance);
  unlocated.sort((a, b) => a.company.name.localeCompare(b.company.name));
  return { near, unlocated };
}

export function jobCities(origin: PlaceHit): string[] {
  const names = new Set<string>();
  for (const company of nepalCompanies) {
    for (const office of company.offices) {
      if (office.city && isNearRecord(origin, office)) names.add(office.city);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function jobCategories(): string[] {
  return [...new Set(nepalCompanies.map((company) => company.category))].sort();
}

export type JobRoleCard = {
  key: string;
  company: NepalCompany;
  title: string;
  url: string;
  location: string | null;
  seen: string;
  placeLabel: string;
  distanceKm: number | null;
  category: string;
};

/** One card per open role, nearest offices first. */
export function jobRoleCards(rows: NearbyCompany[]): JobRoleCard[] {
  const cards: JobRoleCard[] = [];
  for (const row of rows) {
    for (const role of row.company.open_roles) {
      cards.push({
        key: `${row.company.slug}:${role.url}:${role.title}`,
        company: row.company,
        title: role.title,
        url: role.url,
        location: role.location,
        seen: role.seen_date,
        placeLabel: row.placeLabel,
        distanceKm: row.distanceKm,
        category: row.company.category,
      });
    }
  }
  cards.sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return a.title.localeCompare(b.title);
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm || a.title.localeCompare(b.title);
  });
  return cards;
}

export type JobMapPin = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  roleCount: number;
  companyCount: number;
  grouped: boolean;
};

/**
 * Street-level offices get their own pin. City centroids are grouped into one
 * pin per city so a stack of identical points does not cover the map.
 */
export function jobMapPins(rows: NearbyCompany[]): JobMapPin[] {
  const pins = new Map<string, JobMapPin & { slugs: Set<string> }>();
  for (const row of rows) {
    if (row.company.open_roles.length === 0) continue;
    for (const office of row.company.offices) {
      if (office.lat == null || office.lng == null) continue;
      const centroid = office.geo_precision == null || office.geo_precision === "centroid";
      const city = office.city || "Nepal";
      const id = centroid ? `city:${city.toLowerCase()}` : `office:${row.company.slug}:${office.lat.toFixed(4)}`;
      const existing = pins.get(id);
      if (existing) {
        if (!existing.slugs.has(row.company.slug)) {
          existing.slugs.add(row.company.slug);
          existing.roleCount += row.company.open_roles.length;
          existing.companyCount += 1;
        }
        continue;
      }
      pins.set(id, {
        id,
        label: city,
        lat: office.lat,
        lng: office.lng,
        roleCount: row.company.open_roles.length,
        companyCount: 1,
        grouped: centroid,
        slugs: new Set([row.company.slug]),
      });
    }
  }
  return [...pins.values()]
    .map(({ slugs: _slugs, ...pin }) => pin)
    .sort((a, b) => b.roleCount - a.roleCount || a.label.localeCompare(b.label));
}
