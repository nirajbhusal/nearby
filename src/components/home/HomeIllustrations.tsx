const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Monoline drawings for Home. Strokes use currentColor so light and dark stay in ink. */
export function HomeIllustration({ kind }: { kind: "charge" | "jobs" | "events" | "learn" | "nomad" }) {
  return (
    <svg className="home-illu" viewBox="0 0 128 80" aria-hidden="true">
      {kind === "charge" ? <ChargeSketch /> : null}
      {kind === "jobs" ? <JobsSketch /> : null}
      {kind === "events" ? <EventsSketch /> : null}
      {kind === "learn" ? <LearnSketch /> : null}
      {kind === "nomad" ? <NomadSketch /> : null}
    </svg>
  );
}

export function HeroSketch() {
  return (
    <svg className="home-hero-art" viewBox="0 0 150 70" fill="none" aria-hidden="true">
      <circle cx="118" cy="18" r="6.5" {...line} />
      <path d="M118 4.5v4.5M118 27v4.5M104.5 18H109M127 18h4.5" {...line} />
      <path d="M6 50c20-16 32-4 50-14 12-7 20 8 38 4 16-4 24-14 46-6" {...line} />
      <path d="M8 60c22-8 34 6 56-2 16-6 26 6 48 1 10-2 18 1 28-2" {...line} />
      <path d="M28 50v-9h12v9" {...line} />
      <path d="M26 41l8-7 8 7" {...line} />
    </svg>
  );
}

function ChargeSketch() {
  return (
    <>
      <path d="M22 26l-7 14h9l-7 14" {...line} />
      <path d="M30 46c10-2 16 8 28 8 8 0 12-6 20-6" {...line} />
      <path d="M74 36h26c6 0 10 4 10 10v6c0 5-4 8-9 8H76c-6 0-10-3-10-8v-8c0-4 4-8 8-8z" {...line} />
      <path d="M86 36V24M100 36V24" {...line} />
      <path d="M80 48h22" {...line} />
    </>
  );
}

function JobsSketch() {
  return (
    <>
      <rect x="10" y="32" width="48" height="32" rx="5" {...line} />
      <path d="M24 32v-5c0-5 4.5-8 10-8s10 3 10 8v5" {...line} />
      <path d="M10 46h48" {...line} />
      <path d="M32 46v5" {...line} />
      <path d="M70 26h40v24H70z" {...line} />
      <path d="M64 50h52l-5 8H69z" {...line} />
      <path d="M78 34h20M78 41h12" {...line} />
    </>
  );
}

function EventsSketch() {
  return (
    <>
      <path d="M36 32c8-12 18-16 28-16s20 4 28 16" {...line} />
      <path d="M28 32h72" {...line} />
      <path d="M34 32v6M94 32v6" {...line} />
      <rect x="18" y="46" width="92" height="24" rx="5" {...line} />
      <path d="M46 46v24" {...line} strokeDasharray="1.8 3.2" />
      <path d="M78 52v12M72 58h12" {...line} />
      <path d="M74 54l8 8M82 54l-8 8" {...line} />
    </>
  );
}

function LearnSketch() {
  return (
    <>
      <path d="M64 28C56 20 40 18 22 26v36c16-7 32-5 42 2" {...line} />
      <path d="M64 28c8-8 24-10 42-2v36c-16-7-32-5-42 2" {...line} />
      <path d="M64 28v36" {...line} />
      <path d="M32 38h16M32 46h18M80 38h16M78 46h18" {...line} />
      <path d="M102 8v16M94 16h16" {...line} />
      <path d="M96.5 10.5l11 11M107.5 10.5l-11 11" {...line} />
    </>
  );
}

function NomadSketch() {
  return (
    <>
      <path d="M4 60 26 30l14 16L62 16l22 44" {...line} />
      <path d="M72 60 94 34l18 26" {...line} />
      <path d="M24 48c0-11 7-16 16-16h6c9 0 16 5 16 16v16H24z" {...line} />
      <path d="M38 32c1-6 5-8 8-8s7 2 8 8" {...line} />
      <path d="M32 54h24" {...line} />
      <path d="M78 48h34v12H78z" {...line} />
      <path d="M72 60h46" {...line} />
    </>
  );
}
