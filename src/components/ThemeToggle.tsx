"use client";

import { useEffect } from "react";
import { applyThemeChoice, useThemeChoice } from "@/lib/profile-store";
import type { ThemeChoice } from "@/lib/local-profile";
import { msUntilNextBoundary, paintTheme } from "@/lib/tod";

const CHOICES: { id: ThemeChoice; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onMedia = () => {
      const root = document.documentElement;
      if (root.dataset.todLock === "1") return;
      if (root.dataset.themeChoice === "system") applyThemeChoice("system");
    };
    media.addEventListener("change", onMedia);

    const tick = () => {
      const root = document.documentElement;
      if (root.dataset.todLock === "1") return;
      const choice = root.dataset.themeChoice === "light" || root.dataset.themeChoice === "dark" || root.dataset.themeChoice === "system"
        ? root.dataset.themeChoice
        : "auto";
      paintTheme(choice, { fade: choice === "auto" });
    };
    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(() => {
        tick();
        arm();
      }, msUntilNextBoundary());
    };
    const interval = window.setInterval(tick, 60000);
    arm();
    return () => {
      media.removeEventListener("change", onMedia);
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);
  return null;
}

export function ThemeChoiceControl({ compact = false }: { compact?: boolean }) {
  const choice = useThemeChoice();
  return (
    <div className={compact ? "segment segment-compact segment-theme" : "segment segment-theme"} role="group" aria-label="Theme">
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
