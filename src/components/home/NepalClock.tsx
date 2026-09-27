"use client";

import { useEffect, useState } from "react";
import { NPT_CLOCK_SIZER, nepalClockParts, type NepalClockParts } from "@/lib/nepal/npt";
import { syncNepalGreeting } from "@/lib/tod";

function msUntilNextMinute(date: Date): number {
  const into = date.getSeconds() * 1000 + date.getMilliseconds();
  return into === 0 ? 60_000 : 60_000 - into;
}

export function NepalClock() {
  const [parts, setParts] = useState<NepalClockParts | null>(null);

  useEffect(() => {
    let timeout = 0;
    let interval = 0;
    const clear = () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      timeout = 0;
      interval = 0;
    };
    const show = () => {
      const now = new Date();
      setParts(nepalClockParts(now));
      syncNepalGreeting(now);
    };
    const arm = () => {
      clear();
      if (document.hidden) return;
      show();
      timeout = window.setTimeout(() => {
        if (document.hidden) return;
        show();
        interval = window.setInterval(() => {
          if (!document.hidden) show();
        }, 60_000);
      }, msUntilNextMinute(new Date()));
    };
    const onVisibility = () => {
      if (document.hidden) clear();
      else arm();
    };
    document.addEventListener("visibilitychange", onVisibility);
    arm();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clear();
    };
  }, []);

  return (
    <p className="npt-line tabular" data-npt="clock">
      <span className="npt-sizer" aria-hidden="true">
        {NPT_CLOCK_SIZER}
      </span>
      <span className="npt-value" suppressHydrationWarning>
        {parts ? (
          <>
            {parts.weekday}, {parts.day} {parts.month}
            {" · "}
            {parts.hour}
            <span className="npt-colon">:</span>
            {parts.minute} {parts.ampm}
            {" · "}
            {parts.bs}
          </>
        ) : null}
      </span>
    </p>
  );
}
