"use client";

import { useEffect } from "react";
import { applyThemeChoice, useThemeChoice } from "@/lib/profile-store";
import type { ThemeChoice } from "@/lib/local-profile";
import { paintTheme } from "@/lib/tod";

const CHOICES: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onMedia = () => {
      const choice = document.documentElement.dataset.themeChoice;
      if (choice === "system" || choice === "auto" || !choice) paintTheme("system");
    };
    media.addEventListener("change", onMedia);
    return () => media.removeEventListener("change", onMedia);
  }, []);
  return null;
}

export function ThemeChoiceControl({ compact = false }: { compact?: boolean }) {
  const choice = useThemeChoice();
  const current = choice === "auto" ? "system" : choice;
  return (
    <div className={compact ? "segment segment-compact segment-theme" : "segment segment-theme"} role="group" aria-label="Theme">
      {CHOICES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={current === item.id}
          onClick={() => applyThemeChoice(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
