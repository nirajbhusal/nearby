"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  title?: string;
};

/** Location pin for maps and “open on the map”. Not the brand mark. */
export function LogoMark({ className, title }: Props) {
  return (
    <svg className={className} viewBox="0 0 32 32" role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M16 2.2c-6.2 0-10.8 4.6-10.8 10.6 0 7.4 8.8 16 10.1 17.2.4.4 1 .4 1.4 0 1.3-1.2 10.1-9.8 10.1-17.2C26.8 6.8 22.2 2.2 16 2.2Z"
      />
      <circle cx="16" cy="12.6" r="3.2" fill="var(--bg)" />
    </svg>
  );
}

function placeEye(origin: number, scaleY: number) {
  const drop = 8 * (1 - scaleY);
  return `translate(${origin} ${drop.toFixed(2)}) scale(1 ${scaleY.toFixed(3)})`;
}

/** Brand mark: the same two pills as Peek. Blinks, and otherwise stays still. */
export function BrandEyes({ className, title }: Props) {
  const leftRef = useRef<SVGGElement>(null);
  const rightRef = useRef<SVGGElement>(null);
  const labelled = Boolean(title);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    let stopped = false;
    let frame = 0;
    let timer = 0;

    const place = (scaleY: number) => {
      left.setAttribute("transform", placeEye(0, scaleY));
      right.setAttribute("transform", placeEye(16, scaleY));
    };
    const blink = () => {
      const start = performance.now();
      const step = (now: number) => {
        if (stopped) return;
        const p = Math.min(1, (now - start) / 170);
        const scaleY = p < 0.42 ? 1 - (p / 0.42) * 0.88 : 0.12 + ((p - 0.42) / 0.58) * 0.88;
        place(scaleY);
        if (p < 1) frame = requestAnimationFrame(step);
        else place(1);
      };
      frame = requestAnimationFrame(step);
    };
    const arm = () => {
      timer = window.setTimeout(() => {
        if (!document.hidden) blink();
        arm();
      }, 8000 + Math.random() * 7000);
    };
    const onVis = () => {
      window.clearTimeout(timer);
      if (!document.hidden) arm();
    };
    document.addEventListener("visibilitychange", onVis);
    arm();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <svg
      className={className ? `logo-eyes ${className}` : "logo-eyes"}
      viewBox="0 0 26 16"
      role={labelled ? "img" : "presentation"}
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
    >
      <g ref={leftRef} className="peek-eye">
        <rect width="10" height="16" rx="5" />
        <circle className="peek-glint" cx="6.7" cy="4.3" r="1.45" />
      </g>
      <g ref={rightRef} className="peek-eye" transform="translate(16 0)">
        <rect width="10" height="16" rx="5" />
        <circle className="peek-glint" cx="6.7" cy="4.3" r="1.45" />
      </g>
    </svg>
  );
}

export function Wordmark({ className, mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span className={className ?? "wordmark"}>
      {mark ? <BrandEyes /> : null}
      Nearby
    </span>
  );
}
