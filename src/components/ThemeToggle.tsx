"use client";

import { useEffect } from "react";
import { applyThemeChoice, useThemeChoice } from "@/lib/profile-store";
import type { ThemeChoice } from "@/lib/local-profile";

const CHOICES: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (document.documentElement.dataset.themeChoice === "system") applyThemeChoice("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return null;
}

export function ThemeChoiceControl({ compact = false }: { compact?: boolean }) {
  const choice = useThemeChoice();
  return (
    <div className={compact ? "segment segment-compact" : "segment"} role="group" aria-label="Theme">
      {CHOICES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={choice === item.id}
          onClick={() => applyThemeChoice(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
