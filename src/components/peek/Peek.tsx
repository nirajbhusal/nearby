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

export function Peek({ size = 56, state = "idle" }: { size?: number; state?: PeekState }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const leftEye = useRef<SVGGElement>(null);
  const rightEye = useRef<SVGGElement>(null);
  const leftPupil = useRef<SVGCircleElement>(null);
  const rightPupil = useRef<SVGCircleElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const release = watchPointer();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    const onMotion = () => { reduced = motion.matches; };
    motion.addEventListener("change", onMotion);

    let frame = 0;
    let nextBlink = performance.now() + span(3000, 6000);
    let blinkAt = -1;
    let nextGlance = performance.now() + span(4000, 8000);
    let glance = { x: 0, y: 0, until: 0 };
    let dart = { x: 0, y: 0, until: 0 };
    let pupil = { x: 0, y: 0 };
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
        nextBlink = now + span(3000, 6000);
      }
      let scale = 1;
      const age = now - blinkAt;
      if (age >= 0 && age < 150) {
        const p = age / 150;
        scale = p < 0.42 ? 1 - (p / 0.42) * 0.9 : 0.1 + ((p - 0.42) / 0.58) * 0.9;
      }
      if (!reduced && mode === "found") scale = 0.5;

      let tx = 0;
      let ty = 0;
      const fresh = now - ptr.t < 1500;
      if (!reduced && (mode === "looking" || mode === "thinking")) {
        if (now >= dart.until) {
          dart = { x: span(-1, 1), y: span(-0.75, 0.75), until: now + (mode === "thinking" ? 640 : 200) };
        }
        tx = dart.x;
        ty = dart.y;
      } else if (!reduced && mode === "empty") {
        tx = -0.45;
        ty = 0.82;
      } else if (!reduced && mode === "found") {
        ty = -0.4;
      } else if (!reduced && mode === "greet" && now - modeAt < 1100) {
        ty = 0.78;
      } else if (!reduced && fresh && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const dx = ptr.x - (rect.left + rect.width / 2);
        const dy = ptr.y - (rect.top + rect.height * 0.38);
        const len = Math.hypot(dx, dy) || 1;
        const mag = Math.min(1, len / 120);
        tx = (dx / len) * mag;
        ty = (dy / len) * mag;
      } else if (!reduced && mode === "idle") {
        if (now >= nextGlance) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          glance = { x: dir * 0.86, y: span(-0.12, 0.16), until: now + span(320, 560) };
          nextGlance = now + span(4000, 8000);
        }
        if (now < glance.until) {
          tx = glance.x;
          ty = glance.y;
        }
      }

      pupil.x += (tx - pupil.x) * 0.2;
      pupil.y += (ty - pupil.y) * 0.2;
      const px = (pupil.x * 1.05).toFixed(2);
      const py = (pupil.y * 0.72).toFixed(2);
      const squash = scale.toFixed(2);
      leftPupil.current?.setAttribute("cx", px);
      leftPupil.current?.setAttribute("cy", py);
      rightPupil.current?.setAttribute("cx", px);
      rightPupil.current?.setAttribute("cy", py);
      leftEye.current?.setAttribute("transform", `translate(13.15 12.05) scale(1 ${squash})`);
      rightEye.current?.setAttribute("transform", `translate(18.85 12.05) scale(1 ${squash})`);
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
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <g className="peek-body">
        <path
          className="peek-pin"
          d="M16 2.2c-6.2 0-10.8 4.6-10.8 10.6 0 7.4 8.8 16 10.1 17.2.4.4 1 .4 1.4 0 1.3-1.2 10.1-9.8 10.1-17.2C26.8 6.8 22.2 2.2 16 2.2Z"
        />
        <g ref={leftEye} className="peek-eye" transform="translate(13.15 12.05)">
          <ellipse className="peek-sclera" rx="2.35" ry="2.5" />
          <circle ref={leftPupil} className="peek-pupil" r="1.02" />
        </g>
        <g ref={rightEye} className="peek-eye" transform="translate(18.85 12.05)">
          <ellipse className="peek-sclera" rx="2.35" ry="2.5" />
          <circle ref={rightPupil} className="peek-pupil" r="1.02" />
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
