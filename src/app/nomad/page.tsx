import { NomadCityList } from "@/components/nepal/NomadCityList";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Digital nomad — Nearby",
  "Kathmandu and Pokhara for people working from Nepal. Rank and cost figures are credited to Nomads.com.",
  "/nomad",
);

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
      <NomadCityList />
    </main>
  );
}
