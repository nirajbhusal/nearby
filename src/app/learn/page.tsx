import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionPage } from "@/components/nepal/SectionPage";

export const metadata: Metadata = {
  title: "Learn AI — Nearby",
  description: "Places to learn AI in Nepal: universities, bootcamps, and communities.",
};

export default function LearnPage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading programs…</p></main>}>
      <SectionPage section="learn" />
    </Suspense>
  );
}
