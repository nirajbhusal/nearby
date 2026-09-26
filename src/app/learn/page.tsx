import { Suspense } from "react";
import { SectionPage } from "@/components/nepal/SectionPage";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Learn AI — Nearby",
  "Places to learn AI in Nepal: universities, bootcamps, and communities.",
  "/learn",
);

export default function LearnPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading programs…</p></main>}>
      <SectionPage section="learn" />
    </Suspense>
  );
}
