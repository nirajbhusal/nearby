"use client";

import { formatDistance } from "@/lib/local-profile";
import { useUnits } from "@/lib/profile-store";

export function DistanceText({ km }: { km: number }) {
  const unit = useUnits();
  return <>{formatDistance(km, unit)}</>;
}
