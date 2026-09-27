type Scene = "home" | "charge" | "jobs" | "events" | "learn" | "nomad" | "kathmandu" | "pokhara" | "empty" | "profile" | "cafe";

/**
 * One duotone set. Strokes use currentColor. Fills use --illu-fill, which
 * swaps between light and dark.
 */
export function SceneArt({ scene, className }: { scene: Scene; className?: string }) {
  return (
    <svg className={className ?? "scene"} viewBox="0 0 240 160" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {scene === "home" || scene === "empty" ? <HomeScene /> : null}
      {scene === "charge" ? <ChargeScene /> : null}
      {scene === "jobs" || scene === "nomad" ? <DeskScene /> : null}
      {scene === "cafe" ? <DeskScene cup /> : null}
      {scene === "events" ? <EventScene /> : null}
      {scene === "learn" ? <LearnScene /> : null}
      {scene === "kathmandu" ? <KathmanduScene /> : null}
      {scene === "pokhara" ? <PokharaScene /> : null}
      {scene === "profile" ? <ProfileScene /> : null}
    </svg>
  );
}

function Ground() {
  return (
    <>
      <ellipse cx="120" cy="142" rx="96" ry="10" fill="currentColor" opacity="0.08" />
      <path d="M12 148h216" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function HomeScene() {
  return (
    <>
      <path d="M0 108c36-28 58-22 88-34 24-10 34 6 62 4 30-2 42-26 70-18 12 4 16 10 20 16v84H0Z" fill="var(--illu-fill)" />
      <path d="M18 118 62 62l28 22 30-46 24 28 20-16 28 42 22-18" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M86 118V86h28l-2 32" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M80 86h40l-20-16-20 16z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="196" cy="36" r="12" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 132h192" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.16" />
      <path d="M40 132h22M86 132h22M132 132h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <Ground />
    </>
  );
}

function ChargeScene() {
  return (
    <>
      <path d="M0 92c32-24 54-18 84-28 22-8 40 10 66 8 28-2 46-22 72-16 8 2 14 8 18 12v92H0Z" fill="var(--illu-fill)" />
      <path d="M8 128h224" stroke="currentColor" strokeWidth="7" strokeLinecap="round" opacity="0.14" />
      <path d="M28 128h26M78 128h26M128 128h26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="46" y="42" width="48" height="78" rx="14" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="58" y="56" width="24" height="16" rx="3" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M66 82h12M72 76v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M94 70h18c8 0 14 6 14 14v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="118" y="86" width="16" height="10" rx="2" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M146 120h68v-16h-8l-10-18H172l-14 18h-12v16z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M170 96h24l8 12h-40z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="166" cy="122" r="6" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="198" cy="122" r="6" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="28" cy="34" r="10" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="120" cy="140" rx="100" ry="8" fill="currentColor" opacity="0.08" />
    </>
  );
}

function DeskScene({ cup = true }: { cup?: boolean }) {
  return (
    <>
      <path d="M16 46h150a10 10 0 0 1 10 10v46H16V46z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M28 58h86v28H28z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M124 58h28v18h-28z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M36 118h150l-12 18H48z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="58" y="70" width="78" height="48" rx="6" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M70 118h54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M186 96c8-20 22-20 22 2 0 10-6 16-12 18h-8c-4-4-4-12-2-20z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M196 118h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {cup ? (
        <>
          <path d="M150 78h20v14a10 10 0 0 1-10 10h-6" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M170 84h8a7 7 0 0 1 0 14h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M156 70c2-6 8-6 8 0M166 68c2-5 6-5 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : null}
      <Ground />
    </>
  );
}

function EventScene() {
  return (
    <>
      <rect x="58" y="28" width="124" height="108" rx="16" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M58 56h124" stroke="currentColor" strokeWidth="1.5" />
      <path d="M90 18v18M150 18v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M78 74h28M78 94h44M78 114h24M122 74h36M122 94h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="36" cy="42" r="5" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="204" cy="38" r="6" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="214" cy="70" r="3.5" fill="currentColor" />
      <circle cx="28" cy="78" r="3" fill="currentColor" />
      <circle cx="46" cy="108" r="4" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M200 100l8 3-8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="120" cy="146" rx="70" ry="6" fill="currentColor" opacity="0.08" />
    </>
  );
}

function LearnScene() {
  return (
    <>
      <path d="M28 118h120l10 18H40z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M48 118V96h80v22" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M62 46 132 28l48 18-70 26L62 46z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M132 28v22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M78 64c12 14 36 16 52 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M168 92h36l-4 28h-28z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M176 100h20M176 108h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="40" r="4" fill="currentColor" />
      <Ground />
    </>
  );
}

function KathmanduScene() {
  return (
    <>
      <path d="M0 118c40-36 70-28 108-40 28-8 40 8 78 4 22-2 36-16 54-10v88H0Z" fill="var(--illu-fill)" />
      <path d="M8 118c28-16 40-8 62-18 18-8 24 4 46 2 20-2 28-14 48-10" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M22 128V90h34v38" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 90h50L39 68 14 90z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 74h30L39 56 24 74z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 60h14L39 48 32 60z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M39 48v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M86 128V72h58v56" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M76 72h78L115 46 76 72z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M92 52h46L115 30 92 52z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M115 30V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M172 128V96h42v32" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M164 96h58l-29-20-29 20z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M178 80h30l-15-12-15 12z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M30 42c28 8 52-2 78 6 24 8 48 2 74-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="46" y="40" width="9" height="7" rx="1" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1" />
      <rect x="70" y="46" width="9" height="7" rx="1" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1" />
      <rect x="96" y="40" width="9" height="7" rx="1" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1" />
      <rect x="122" y="48" width="9" height="7" rx="1" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1" />
      <rect x="148" y="40" width="9" height="7" rx="1" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1" />
      <circle cx="208" cy="28" r="8" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="120" cy="142" rx="100" ry="8" fill="currentColor" opacity="0.08" />
      <path d="M8 148h224" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function PokharaScene() {
  return (
    <>
      <path d="M0 108 36 42l32 34 28-46 26 30 20-18 34 40 22-24 42 50v32H0Z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M132 58 156 22l22 36" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M0 108h240v52H0z" fill="var(--illu-fill-2)" />
      <path d="M0 112c28 14 52 14 80 0s52-12 74 2 40 8 58-4 22-6 28 2v40H0Z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 126c22 10 44 10 66 0s44-8 64 2 36 6 48-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M78 124h36l-6 8H84z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M96 124V110" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M96 110h16l-16 8z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="28" cy="32" r="10" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 150h224" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function ProfileScene() {
  return (
    <>
      <circle cx="120" cy="48" r="24" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M68 128c8-32 30-46 52-46s44 14 52 46" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <Ground />
    </>
  );
}
