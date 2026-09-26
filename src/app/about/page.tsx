import Link from "next/link";
import { SketchPin } from "@/components/illustrations/SketchPin";
import { CityHorizon } from "@/components/illustrations/CityHorizon";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-8 flex items-center gap-3">
        <SketchPin className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--graphite)] sm:text-4xl">
          About Nearby
        </h1>
      </div>

      <div className="mb-10 text-[var(--ink-faint)]">
        <CityHorizon className="h-14 w-full" stroke="currentColor" />
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-[var(--ink-muted)]">
        <p>
          Nearby is a Nepal-first finder for EV charging, tech jobs, places to
          learn AI, and tech and AI events. Search a city, district, or
          neighborhood — Kathmandu, Patan, Pokhara, Chitwan, and the rest of
          the country — or use your location. Results are sorted by distance.
        </p>
        <p>
          The lists are curated. Each record traces back to a public directory
          or an official company or organizer page, and the useful ones link
          through. The set was compiled on 26 Sep 2026. It is not a field visit:
          chargers move, roles close, and class dates change. Where a station
          does not say it is public, Nearby says so and asks you to call ahead.
        </p>
        <p>
          Map tiles are from OpenStreetMap contributors. Station coordinates
          come from public operator directories and OpenStreetMap. Company
          offices are city centroids, not street addresses. A worldwide view of
          jobs and AI meetups is still there if you need it.
        </p>
      </div>
      <p className="mt-10 flex flex-wrap gap-4">
        <Link href="/" className="ink-link text-sm">
          ← Find nearby
        </Link>
        <Link href="/worldwide" className="ink-link text-sm">
          Worldwide jobs and meetups
        </Link>
      </p>
    </main>
  );
}
