"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/brand/Logo";

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
    const timer = window.setTimeout(skip, 900);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="intro-splash" aria-hidden="true">
      <div className="intro-mark">
        <span className="intro-ripple" />
        <LogoMark className="intro-pin" />
      </div>
      <p className="intro-word">Nearby</p>
      <p className="intro-tag">All within reach.</p>
    </div>
  );
}
