"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type PeekState = "idle" | "greet" | "looking" | "found" | "empty" | "thinking";

const ptr = { x: 0, y: 0, t: 0 };
let watchers = 0;
let unwatch = () => {};

function watchPointer() {
  if (watchers === 0) {
    const onPoint = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      ptr.x = event.clientX;
      ptr.y = event.clientY;
      ptr.t = performance.now();
    };
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) return;
      ptr.x = touch.clientX;
      ptr.y = touch.clientY;
      ptr.t = performance.now();
    };
    window.addEventListener("pointermove", onPoint, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    unwatch = () => {
      window.removeEventListener("pointermove", onPoint);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
    };
  }
  watchers += 1;
  return () => {
    watchers -= 1;
    if (watchers === 0) unwatch();
  };
}

function span(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Holds a status, then lets greet and found settle back to idle. */
export function usePeekState(initial: PeekState = "idle") {
  const [state, setState] = useState(initial);
  useEffect(() => {
    if (state !== "found" && state !== "greet") return;
    const id = window.setTimeout(() => setState("idle"), state === "greet" ? 1700 : 900);
    return () => window.clearTimeout(id);
  }, [state]);
  return [state, setState] as const;
}

const VB_W = 26;
const EYE_GAP = 16;

function placeEye(origin: number, x: number, y: number, scaleY: number) {
  const drop = 8 * (1 - scaleY) + y;
  return `translate(${(origin + x).toFixed(2)} ${drop.toFixed(2)}) scale(1 ${scaleY.toFixed(3)})`;
}

export function Peek({ size = 56, state = "idle" }: { size?: number; state?: PeekState }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const leftRef = useRef<SVGGElement>(null);
  const rightRef = useRef<SVGGElement>(null);
  const stateRef = useRef(state);
  const sizeRef = useRef(size);
  stateRef.current = state;
  sizeRef.current = size;

  useEffect(() => {
    const release = watchPointer();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    const onMotion = () => {
      reduced = motion.matches;
    };
    motion.addEventListener("change", onMotion);

    let frame = 0;
    let nextBlink = performance.now() + span(2200, 4200);
    let blinkAt = -1;
    let blinkPair = false;
    let nextGlance = performance.now() + span(2800, 5200);
    let glance = { x: 0, y: 0, until: 0 };
    let dart = { x: 0, y: 0, until: 0 };
    let pos = { x: 0, y: 0 };
    let mode = stateRef.current;
    let modeAt = performance.now();
    let pausedAt = 0;

    const onVis = () => {
      if (document.hidden) pausedAt = performance.now();
      else if (pausedAt) {
        const drift = performance.now() - pausedAt;
        nextBlink += drift;
        nextGlance += drift;
        glance.until += drift;
        dart.until += drift;
        modeAt += drift;
        if (blinkAt > 0) blinkAt += drift;
        pausedAt = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;
      const next = stateRef.current;
      if (next !== mode) {
        mode = next;
        modeAt = now;
        dart.until = 0;
        if (mode === "greet") nextBlink = now + 620;
      }

      if (now >= nextBlink && mode !== "found") {
        blinkAt = now;
        if (mode === "idle" && !blinkPair && Math.random() < 0.28) {
          nextBlink = now + 320;
          blinkPair = true;
        } else {
          blinkPair = false;
          nextBlink = now + span(2800, 5600);
        }
      }

      let blink = 1;
      const age = now - blinkAt;
      if (age >= 0 && age < 150) {
        const p = age / 150;
        blink = p < 0.42 ? 1 - (p / 0.42) * 0.92 : 0.08 + ((p - 0.42) / 0.58) * 0.92;
      }

      const px = sizeRef.current;
      const maxX = Math.min(3.6, px * 0.16) * (VB_W / px);
      const maxY = maxX * 0.7;
      let goalX = 0;
      let goalY = 0;
      let base = 1;
      const fresh = now - ptr.t < 1500;

      if (reduced) {
        if (mode === "empty") base = 0.82;
      } else if (mode === "looking") {
        if (now >= dart.until) {
          dart = { x: span(-1, 1), y: span(-0.8, 0.8), until: now + span(110, 200) };
        }
        goalX = dart.x * maxX;
        goalY = dart.y * maxY;
      } else if (mode === "thinking") {
        goalX = Math.sin((now - modeAt) / 420) * maxX;
        goalY = -0.9 * maxY;
      } else if (mode === "empty") {
        goalX = -0.75 * maxX;
        goalY = 0.95 * maxY;
        base = 0.78;
      } else if (mode === "found") {
        goalY = -0.2 * maxY;
      } else if (mode === "greet" && now - modeAt < 1100) {
        goalY = 0.85 * maxY;
      } else if (fresh && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const dx = ptr.x - (rect.left + rect.width / 2);
        const dy = ptr.y - (rect.top + rect.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        const mag = Math.min(1, len / 120);
        goalX = (dx / len) * mag * maxX;
        goalY = (dy / len) * mag * maxY;
      } else if (mode === "idle") {
        if (now >= nextGlance) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          glance = { x: dir, y: span(-0.15, 0.2), until: now + span(380, 640) };
          nextGlance = now + span(3600, 7000);
        }
        if (now < glance.until) {
          goalX = glance.x * maxX;
          goalY = glance.y * maxY;
        }
      }

      const ease = !reduced && mode === "looking" ? 0.62 : 0.2;
      pos.x += (goalX - pos.x) * ease;
      pos.y += (goalY - pos.y) * ease;
      const scaleY = mode === "found" ? 1 : base * blink;
      leftRef.current?.setAttribute("transform", placeEye(0, pos.x, pos.y, scaleY));
      rightRef.current?.setAttribute("transform", placeEye(EYE_GAP, pos.x, pos.y, scaleY));
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      release();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="peek"
      data-state={state}
      width={size}
      height={(size * 16) / 26}
      viewBox="0 0 26 16"
      aria-hidden="true"
    >
      <g className="peek-body">
        <g ref={leftRef} className="peek-eye">
          <g className="peek-open">
            <rect width="10" height="16" rx="5" />
            <circle className="peek-glint" cx="6.7" cy="4.3" r="1.45" />
          </g>
          <path className="peek-arc" d="M1.15 9.5 Q5 2.2 8.85 9.5" />
        </g>
        <g ref={rightRef} className="peek-eye" transform="translate(16 0)">
          <g className="peek-open">
            <rect width="10" height="16" rx="5" />
            <circle className="peek-glint" cx="6.7" cy="4.3" r="1.45" />
          </g>
          <path className="peek-arc" d="M1.15 9.5 Q5 2.2 8.85 9.5" />
        </g>
      </g>
    </svg>
  );
}

export function HomePeek() {
  const [state, setState] = usePeekState("idle");
  useLayoutEffect(() => {
    let started = false;
    const start = () => {
      if (started || document.documentElement.dataset.intro === "play") return;
      started = true;
      setState("greet");
    };
    start();
    const observer = new MutationObserver(start);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });
    const backup = window.setTimeout(start, 1100);
    return () => {
      observer.disconnect();
      window.clearTimeout(backup);
    };
  }, [setState]);
  return (
    <div className="home-peek">
      <Peek size={56} state={state} />
    </div>
  );
}

export function PeekEmpty({ children, state = "empty" }: { children: ReactNode; state?: PeekState }) {
  return (
    <div className="peek-empty">
      <Peek size={64} state={state} />
      {children}
    </div>
  );
}

export function PeekLoading({ label }: { label: string }) {
  return (
    <div className="map-skeleton peek-stage" role="status" aria-label={label}>
      <Peek size={64} state="looking" />
    </div>
  );
}
