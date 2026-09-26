import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionPage } from "@/components/nepal/SectionPage";

export const metadata: Metadata = {
  title: "Tech events — Nearby",
  description: "Tech and AI events in Nepal: upcoming dates, regular series, and recent meetups.",
};

export default function EventsPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading events…</p></main>}>
      <SectionPage section="events" />
    </Suspense>
  );
}
