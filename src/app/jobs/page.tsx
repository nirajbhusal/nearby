import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionPage } from "@/components/nepal/SectionPage";

export const metadata: Metadata = {
  title: "Tech jobs — Nearby",
  description: "Tech companies and open roles in Nepal, sorted around a city you choose.",
};

export default function JobsPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading jobs…</p></main>}>
      <SectionPage section="jobs" />
    </Suspense>
  );
}
