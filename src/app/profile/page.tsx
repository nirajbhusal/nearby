import { Suspense } from "react";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Profile — Nearby",
  "A profile saved on this device: home city, EV connectors, interests, and saved places. Sign-in is not available yet.",
  "/profile",
);

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="page-wrap"><p className="lede">Loading profile…</p></main>}>
      <ProfileScreen />
    </Suspense>
  );
}
