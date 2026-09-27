import { Suspense } from "react";
import { NomadIndex } from "@/components/nepal/NomadIndex";
import { getNomadCity } from "@/lib/nepal/nomad";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Digital nomad — Nearby · All within reach",
  "Kathmandu and Pokhara for people working from Nepal. Rank and cost figures are credited to Nomads.com.",
  "/nomad",
);

export default function NomadIndexPage() {
  const kathmandu = getNomadCity("kathmandu");
  const pokhara = getNomadCity("pokhara");
  if (!kathmandu || !pokhara) return null;
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading the city guide…</p></main>}>
      <NomadIndex kathmandu={kathmandu} pokhara={pokhara} />
    </Suspense>
  );
}
