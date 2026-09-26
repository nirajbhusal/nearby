import { notFound } from "next/navigation";
import { NomadCityGuide } from "@/components/nepal/NomadCityGuide";
import { getNomadCity, nomadCities } from "@/lib/nepal/nomad";
import { pageMeta } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return nomadCities.map((city) => ({ city: city.slug }));
}

type Params = Promise<{ city: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { city: slug } = await params;
  const city = getNomadCity(slug);
  if (!city) return { title: "Nomad city — Nearby" };
  return pageMeta(
    `${city.name} for nomads — Nearby`,
    `Where to live and work in ${city.name}, Nepal, with sourced reference figures.`,
    `/nomad/${city.slug}`,
  );
}

export default async function NomadCityPage({ params }: { params: Params }) {
  const { city: slug } = await params;
  const city = getNomadCity(slug);
  if (!city) notFound();
  return <NomadCityGuide city={city} />;
}
