"use client";

import { Share } from "lucide-react";
import { shareOrCopy } from "@/lib/item-link";

export function ShareButton({ title, url, text }: { title: string; url: string; text?: string }) {
  return (
    <button
      type="button"
      className="save-btn share-btn"
      aria-label={`Share ${title}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void shareOrCopy({ title, text, url });
      }}
    >
      <Share size={16} strokeWidth={1.5} aria-hidden />
    </button>
  );
}
