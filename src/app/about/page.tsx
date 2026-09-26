import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "About — Nearby",
  "Nearby is a Nepal-only guide to EV charging, tech jobs, AI learning, events, and working from Kathmandu or Pokhara.",
  "/about",
);

export default function AboutPage() {
  return (
    <main className="page-wrap about-wrap">
      <header className="page-hero">
        <p className="eyebrow">About</p>
        <h1 className="font-display page-title">Nearby, for Nepal</h1>
        <LogoMark className="logo-mark hero-mark" title="Nearby" />
      </header>
      <div className="prose">
        <p>
          Nearby helps you find an EV charger in Nepal, check whether it looks
          usable, and start navigation. The same app lists tech jobs, places to
          learn AI, tech events, and a short digital-nomad page for Kathmandu
          and Pokhara.
        </p>
        <p>
          The lists are curated. Each record traces back to a public directory
          or an official page, and the useful ones link through. The set was
          compiled on 26 Sep 2026. It is not a field visit: chargers move, roles
          close, and class dates change. Where a station does not say it is
          public, Nearby says so and asks you to call ahead.
        </p>
        <p>
          Map tiles are © OpenStreetMap contributors, via OpenFreeMap. Province
          outlines are geoBoundaries ADM1 for Nepal (2020), © geoBoundaries,
          licensed CC BY 3.0 IGO. The Survey Department of Nepal and OCHA FISS
          compiled those boundaries. Each charger is placed in a province by a
          point-in-polygon test against them. Station coordinates come from
          public operator directories and OpenStreetMap. Company offices are
          a building or street point, an area, or still the city centre. The
          jobs map marks which. Nomad stays, areas, and figures are credited
          on the city page, each with the date it was current.
        </p>
      </div>
      <p className="link-row">
        <Link href="/charge" className="btn-primary">
          Open the charger map
        </Link>
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </p>
    </main>
  );
}
