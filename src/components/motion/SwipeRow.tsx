"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Heart, Share } from "lucide-react";
import { isSaved, toggleSaved, useSaved } from "@/lib/profile-store";
import type { SavedRecord } from "@/lib/local-profile";
import { hapticTick, shareOrCopy } from "@/lib/item-link";
import { showToast } from "@/lib/toast";

const USED_KEY = "nearby-swipe-used";

type Drag = {
  x: number;
  y: number;
  t: number;
  pointerId: number;
  axis: "x" | "y" | null;
};

function markSwipeUsed() {
  try {
    localStorage.setItem(USED_KEY, "1");
  } catch {
    /* private mode */
  }
  document.querySelectorAll(".swipe-row.is-hint").forEach((node) => node.classList.remove("is-hint"));
}

export function SwipeRow({
  item,
  share,
  children,
}: {
  item: SavedRecord;
  share: { title: string; text?: string; url: string };
  children: ReactNode;
}) {
  const saved = useSaved();
  const on = isSaved(saved, item.kind, item.id);
  const row = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pop, setPop] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(USED_KEY) === "1") return;
    } catch {
      return;
    }
    const win = window as Window & { __nearbyHint?: boolean };
    if (win.__nearbyHint) return;
    win.__nearbyHint = true;
    setHint(true);
  }, []);

  function commitSave() {
    const removing = on;
    toggleSaved(item);
    hapticTick();
    markSwipeUsed();
    setHint(false);
    if (!removing) {
      setPop(true);
      window.setTimeout(() => setPop(false), 320);
    }
    showToast(removing ? "Removed" : "Saved", () => toggleSaved(item));
  }

  function commitShare() {
    markSwipeUsed();
    setHint(false);
    hapticTick();
    void shareOrCopy(share);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.clientX <= 20) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, .save-btn, .share-btn, summary, input, textarea, select")) return;
    drag.current = { x: event.clientX, y: event.clientY, t: performance.now(), pointerId: event.pointerId, axis: null };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (!start.axis) {
      if (Math.hypot(deltaX, deltaY) < 10) return;
      start.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      if (start.axis === "y") {
        drag.current = null;
        return;
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* synthetic pointers */
      }
      setDragging(true);
    }
    if (start.axis !== "x") return;
    const width = row.current?.offsetWidth ?? 1;
    setDx(Math.max(-width, Math.min(width, deltaX)));
  }

  function finish(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    drag.current = null;
    setDragging(false);
    if (!start || start.axis !== "x") {
      setDx(0);
      return;
    }
    const deltaX = event.clientX - start.x;
    const dt = Math.max(1, performance.now() - start.t);
    const velocity = deltaX / dt;
    const width = row.current?.offsetWidth || 1;
    const fling = Math.abs(velocity) > 0.6 && Math.abs(deltaX) > 48;
    const passed = Math.abs(deltaX) > width * 0.35;
    if ((fling || passed) && deltaX > 0) commitSave();
    else if ((fling || passed) && deltaX < 0) commitShare();
    else if (Math.abs(deltaX) > 8) {
      const stopClick = (click: Event) => {
        click.preventDefault();
        click.stopPropagation();
      };
      row.current?.addEventListener("click", stopClick, { capture: true, once: true });
    }
    setDx(0);
  }

  return (
    <div
      ref={row}
      className={hint ? "swipe-row is-hint" : "swipe-row"}
      data-swipe="1"
      data-item-id={item.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        setDx(0);
      }}
    >
      <div className="swipe-action is-save" aria-hidden>
        <Heart className={pop ? "swipe-heart is-pop" : "swipe-heart"} size={22} strokeWidth={1.5} fill={on ? "currentColor" : "none"} />
      </div>
      <div className="swipe-action is-share" aria-hidden>
        <Share size={20} strokeWidth={1.5} />
      </div>
      <div className={dragging ? "swipe-face is-dragging" : "swipe-face"} style={{ transform: `translateX(${dx}px)` }}>
        {children}
      </div>
      {hint ? <p className="swipe-hint">Swipe to save or share</p> : null}
    </div>
  );
}
