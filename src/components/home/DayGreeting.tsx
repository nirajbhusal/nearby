"use client";

import { useSyncExternalStore } from "react";
import { useProfile } from "@/lib/profile-store";
import { readGreeting, TOD_EVENT } from "@/lib/tod";

function subscribe(onChange: () => void) {
  window.addEventListener(TOD_EVENT, onChange);
  window.addEventListener("nearby-theme", onChange);
  return () => {
    window.removeEventListener(TOD_EVENT, onChange);
    window.removeEventListener("nearby-theme", onChange);
  };
}

export function DayGreeting() {
  const profile = useProfile();
  const greeting = useSyncExternalStore(subscribe, readGreeting, () => "Good night");
  const name = profile.name.trim();
  const text = name ? `${greeting}, ${name}` : greeting;
  return (
    <p className="day-greeting">
      <span id="nearby-greet" suppressHydrationWarning>
        {text}
      </span>
    </p>
  );
}
