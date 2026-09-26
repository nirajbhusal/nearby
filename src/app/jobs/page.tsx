import { Suspense } from "react";
import { SectionPage } from "@/components/nepal/SectionPage";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Tech jobs — Nearby",
  "Tech companies and open roles in Nepal, sorted around a city you choose.",
  "/jobs",
);

export default function JobsPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading jobs…</p></main>}>
      <SectionPage section="jobs" />
    </Suspense>
  );
}
