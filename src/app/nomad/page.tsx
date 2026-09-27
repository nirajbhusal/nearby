import { NomadCityGuide } from "@/components/nepal/NomadCityGuide";
import { getNomadCity } from "@/lib/nepal/nomad";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Digital nomad — Nearby · All within reach",
  "Kathmandu and Pokhara for people working from Nepal. Rank and cost figures are credited to Nomads.com.",
  "/nomad",
);

export default function NomadIndexPage() {
  const city = getNomadCity("kathmandu");
  if (!city) return null;
  return <NomadCityGuide city={city} />;
}
