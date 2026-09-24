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
          Nearby finds roles and AI meetups near you — not a traditional job
          board. Tell us where you are (or what kind of work you’re after), and
          we recommend companies hiring nearby alongside upcoming AI events in
          the area.
        </p>
        <p>
          Recommendations are ranked from a continuously curated set of
          companies: location overlap first, then a light match on role intent.
          AI meetups are surfaced the same way — by city overlap, or the soonest
          upcoming elsewhere when nothing local matches. No endless filters,
          badge grids, or directory browsing.
        </p>
        <p>
          Open a recommendation to learn more, or jump straight to open roles
          on the company’s careers page.
        </p>
      </div>
      <p className="mt-10">
        <Link href="/" className="ink-link text-sm">
          ← Find nearby
        </Link>
      </p>
    </main>
  );
}
