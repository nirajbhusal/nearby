import { Suspense } from "react";
import { FoodExplorer } from "@/components/food/FoodExplorer";
import { PeekLoading } from "@/components/peek/Peek";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Cafés & food — Nearby · All within reach",
  "Cafés and places to eat in Kathmandu and Pokhara. Filter by coffee, food, local food, or Thakali, then open a map.",
  "/food",
);

export default function FoodPage() {
  return (
    <Suspense
      fallback={
        <div className="charge-stage">
          <PeekLoading label="Loading cafés and food" />
        </div>
      }
    >
      <FoodExplorer />
    </Suspense>
  );
}
