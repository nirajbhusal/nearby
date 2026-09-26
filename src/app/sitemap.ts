import type { MetadataRoute } from "next";
import { allStationIds } from "@/lib/nepal/stations";
import { nomadCities } from "@/lib/nepal/nomad";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-09-26");
  const paths = [
    "/",
    "/charge/",
    "/jobs/",
    "/learn/",
    "/events/",
    "/nomad/",
    "/about/",
    ...nomadCities.map((city) => `/nomad/${city.slug}/`),
    ...allStationIds().map((id) => `/ev/${id}/`),
  ];
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));
}
