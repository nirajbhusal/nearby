import type { Metadata } from "next";
import { NearbyFinder } from "@/components/NearbyFinder";

export const metadata: Metadata = {
  title: "Worldwide — Nearby",
  description:
    "Jobs and AI meetups outside Nepal. A place-first finder for curated companies and upcoming gatherings.",
};

export default function WorldwidePage() {
  return (
    <main className="flex flex-1 flex-col">
      <NearbyFinder />
    </main>
  );
}
