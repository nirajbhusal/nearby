"use client";

import { Heart } from "lucide-react";
import { toggleSaved, useSaved } from "@/lib/profile-store";
import type { SavedRecord } from "@/lib/local-profile";

export function SaveButton({ item }: { item: SavedRecord }) {
  const saved = useSaved();
  const on = saved.some((row) => row.kind === item.kind && row.id === item.id);
  return (
    <button
      type="button"
      className={on ? "save-btn is-on" : "save-btn"}
      aria-pressed={on}
      aria-label={on ? `Remove ${item.title} from saved` : `Save ${item.title}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSaved(item);
      }}
    >
      <Heart size={16} strokeWidth={2.1} fill={on ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}

export function FitMark() {
  return (
    <span className="fit-mark">
      <span aria-hidden>✓</span>
      <span className="sr-only">Fits your car</span>
    </span>
  );
}
