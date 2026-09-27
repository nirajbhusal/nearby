"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { applyThemeChoice, useThemeChoice } from "@/lib/profile-store";
import type { ThemeChoice } from "@/lib/local-profile";
import { paintTheme } from "@/lib/tod";

const CHOICES: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function currentChoice(choice: ThemeChoice): "system" | "light" | "dark" {
  if (choice === "light" || choice === "dark") return choice;
  return "system";
}

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

export function ThemeMenuButton() {
  const choice = currentChoice(useThemeChoice());
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const Icon = choice === "light" ? Sun : choice === "dark" ? Moon : Monitor;
  const label = CHOICES.find((item) => item.id === choice)?.label ?? "System";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="theme-menu" ref={root}>
      <button
        type="button"
        className="icon-btn theme-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme, ${label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon size={20} strokeWidth={1.5} aria-hidden />
      </button>
      {open ? (
        <div className="theme-popover" role="menu" aria-label="Theme">
          {CHOICES.map((item) => {
            const on = choice === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  applyThemeChoice(item.id);
                  setOpen(false);
                }}
              >
                <span>{item.label}</span>
                {on ? <Check size={16} strokeWidth={2} aria-hidden /> : <span className="theme-check-gap" aria-hidden />}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
