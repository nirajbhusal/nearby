"use client";

import { useEffect } from "react";

/** Visual only. Pointers pass through, and the first tap ends the intro. */
export function IntroSplash() {
  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") return;
    const skip = () => {
      if (document.documentElement.dataset.intro === "play") {
        document.documentElement.dataset.intro = "done";
      }
    };
    window.addEventListener("pointerdown", skip, { once: true });
    const timer = window.setTimeout(skip, 1100);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="intro-splash" aria-hidden="true">
      <svg className="intro-eyes" viewBox="0 0 26 16" aria-hidden="true">
        <g className="intro-eye peek-eye">
          <rect width="10" height="16" rx="5" />
          <circle className="peek-glint" cx="6.7" cy="4.3" r="1.45" />
        </g>
        <g transform="translate(16 0)">
          <g className="intro-eye peek-eye">
            <rect width="10" height="16" rx="5" />
            <circle className="peek-glint" cx="6.7" cy="4.3" r="1.45" />
          </g>
        </g>
      </svg>
      <p className="intro-word">Nearby</p>
      <p className="intro-tag">All within reach.</p>
    </div>
  );
}
