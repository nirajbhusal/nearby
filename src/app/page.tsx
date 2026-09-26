import { Suspense } from "react";
import { NepalFinder } from "@/components/nepal/NepalFinder";
import { SketchPin } from "@/components/illustrations/SketchPin";

function HomeFallback() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
      <div className="flex justify-center text-[var(--accent)]">
        <SketchPin className="h-9 w-9" />
      </div>
      <h1 className="mt-4 text-center font-display text-4xl font-medium tracking-tight">
        Where should we look?
      </h1>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<HomeFallback />}>
        <NepalFinder />
      </Suspense>
    </main>
  );
}
