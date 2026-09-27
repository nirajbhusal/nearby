type Scene = "home" | "charge" | "jobs" | "events" | "learn" | "nomad" | "kathmandu" | "pokhara" | "empty" | "profile" | "cafe";

/**
 * One duotone set. Strokes use currentColor. Fills use --illu-fill, which
 * swaps between light and dark.
 */
export function SceneArt({ scene, className }: { scene: Scene; className?: string }) {
  return (
    <svg className={className ?? "scene"} viewBox="0 0 240 160" fill="none" aria-hidden="true">
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

function S({ d, fill = false }: { d: string; fill?: boolean }) {
  if (fill) return <path d={d} fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />;
  return <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
}

function HomeScene() {
  return (
    <>
      <path d="M28 118c28-8 48-36 62-36s22 18 40 18 30-22 48-28 34 8 40 18v28H28v-0z" fill="var(--illu-fill)" />
      <S d="M24 122h192" />
      <S d="M46 122 78 78l22 18 26-40 20 22 18-14 24 36" />
      <circle cx="176" cy="46" r="12" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="120" cy="96" r="5" fill="currentColor" />
    </>
  );
}

function ChargeScene() {
  return (
    <>
      <rect x="78" y="28" width="52" height="92" rx="14" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="92" y="44" width="24" height="16" rx="3" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <S d="M98 78h12M104 72v12" />
      <path d="M130 58h18c10 0 16 8 16 18v10c0 8-6 12-12 12h-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="138" y="92" width="18" height="12" rx="3" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <S d="M92 120h24" />
      <path d="M70 132h100" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function DeskScene({ cup = true }: { cup?: boolean }) {
  return (
    <>
      <path d="M48 108h120l-10 16H58z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="62" y="48" width="92" height="60" rx="6" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <S d="M78 108h60" />
      {cup ? (
        <>
          <path d="M168 70h22v16a12 12 0 0 1-12 12h-6" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <S d="M190 76h8a8 8 0 0 1 0 16h-6" />
          <S d="M174 62c2-6 8-6 8 0M184 60c2-5 6-5 6 0" />
        </>
      ) : null}
    </>
  );
}

function EventScene() {
  return (
    <>
      <rect x="64" y="36" width="112" height="100" rx="14" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <S d="M64 62h112" />
      <S d="M92 28v16M148 28v16" />
      <S d="M86 84h20M86 104h36M122 84h28" />
      <circle cx="52" cy="48" r="4" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="188" cy="44" r="5" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="196" cy="78" r="3.5" fill="currentColor" />
      <circle cx="46" cy="86" r="3" fill="currentColor" />
      <path d="M40 64l6 2-6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function LearnScene() {
  return (
    <>
      <path d="M48 108h88l8 16H56z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <S d="M64 108V92h56v16" />
      <path d="M78 40 132 28l36 16-54 20-36-24z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <S d="M132 28v18" />
      <path d="M96 58c8 10 28 12 40 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="168" cy="44" r="3" fill="currentColor" />
    </>
  );
}

function KathmanduScene() {
  return (
    <>
      <path d="M16 128h208" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 128V92h28v36" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M28 92h44L50 72 28 92z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M38 78h24L50 62 38 78z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M44 66h12L50 54 44 66z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <S d="M50 54V44" />
      <path d="M96 128V78h52v50" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M88 78h68L122 54 88 78z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M102 60h40L122 40 102 60z" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <S d="M122 40V28" />
      <path d="M168 128V100h36v28" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M162 100h48l-24-18-24 18z" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="200" cy="36" r="8" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
    </>
  );
}

function PokharaScene() {
  return (
    <>
      <path d="M8 96 52 40l28 28 24-36 22 24 18-16 36 40 28-22 24 38" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M148 48 168 24l16 22" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 118c28 16 52 16 80 0s52-14 72 0 36 10 52-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 132c24 12 48 12 74 0s50-12 70 2 34 8 46-2" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="36" r="8" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
    </>
  );
}

function ProfileScene() {
  return (
    <>
      <circle cx="120" cy="52" r="22" fill="var(--illu-fill-2)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M72 128c8-28 28-42 48-42s40 14 48 42" fill="var(--illu-fill)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  );
}
