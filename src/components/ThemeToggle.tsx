"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener("nearby-theme", onChange);
  return () => window.removeEventListener("nearby-theme", onChange);
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("nearby-theme", theme);
  } catch {
    /* private mode */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#F5F5F7" : "#000000");
  window.dispatchEvent(new Event("nearby-theme"));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => applyTheme(next)}
    >
      <Icon size={18} strokeWidth={2.1} aria-hidden />
    </button>
  );
}
