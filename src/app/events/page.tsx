import { Suspense } from "react";
import { SectionPage } from "@/components/nepal/SectionPage";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Tech events — Nearby",
  "Tech and AI events in Nepal: upcoming dates, regular series, and recent meetups.",
  "/events",
);

export default function EventsPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading events…</p></main>}>
      <SectionPage section="events" />
    </Suspense>
  );
}
