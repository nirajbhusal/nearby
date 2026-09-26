import type { Metadata } from "next";
import Link from "next/link";
import { CityHorizon } from "@/components/illustrations/CityHorizon";

export const metadata: Metadata = {
  title: "About — Nearby",
  description:
    "Nearby is a Nepal-only guide to EV charging, tech jobs, AI learning, events, and working from Kathmandu or Pokhara.",
};

export default function AboutPage() {
  return (
    <main className="page-wrap about-wrap">
      <header className="page-hero">
        <p className="eyebrow">About</p>
        <h1 className="font-display page-title">Nearby, for Nepal</h1>
        <CityHorizon className="hero-sketch" />
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
          Map tiles are © OpenStreetMap contributors. Station coordinates come
          from public operator directories and OpenStreetMap. Company offices
          are city centroids, not street addresses. Nomad rank and monthly cost
          figures are credited on the city page, with the date they were current.
          Coworking, cafés, visas, and neighbourhoods stay blank until a sourced
          figure is added.
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
