"use client";

import { NomadCityGuide } from "@/components/nepal/NomadCityGuide";
import { useClientSearch } from "@/lib/client-search";
import type { NomadCity } from "@/lib/nepal/nomad-shared";

export function NomadIndex({ kathmandu, pokhara }: { kathmandu: NomadCity; pokhara: NomadCity }) {
  const search = useClientSearch();
  const city = search.get("city") === "pokhara" ? pokhara : kathmandu;
  return <NomadCityGuide city={city} stayId={search.get("stay")} workId={search.get("work")} />;
}
