type Scene = "home" | "charge" | "jobs" | "events" | "learn" | "nomad" | "kathmandu" | "pokhara" | "empty" | "profile";

/** One monoline illustration set. Strokes follow currentColor so both themes work. */
export function SceneArt({ scene, className }: { scene: Scene; className?: string }) {
  return (
    <svg className={className ?? "scene"} viewBox="0 0 160 96" fill="none" aria-hidden="true">
      {scene === "home" || scene === "empty" ? <HomeLines /> : null}
      {scene === "charge" ? <ChargeLines /> : null}
      {scene === "jobs" ? <JobsLines /> : null}
      {scene === "events" ? <EventLines /> : null}
      {scene === "learn" ? <LearnLines /> : null}
      {scene === "nomad" || scene === "kathmandu" ? <CityLines lake={false} /> : null}
      {scene === "pokhara" ? <CityLines lake /> : null}
      {scene === "profile" ? <ProfileLines /> : null}
    </svg>
  );
}

function stroke() {
  return { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

function HomeLines() {
  const s = stroke();
  return (
    <>
      <path {...s} d="M12 70h136" />
      <path {...s} d="M28 70 48 42l16 18 22-32 18 22 16-12 12 32" />
      <circle {...s} cx="118" cy="28" r="8" />
    </>
  );
}

function ChargeLines() {
  const s = stroke();
  return (
    <>
      <rect {...s} x="58" y="22" width="44" height="56" rx="10" />
      <path {...s} d="M80 36v28M72 48h16" />
      <path {...s} d="M70 78h20" />
    </>
  );
}

function JobsLines() {
  const s = stroke();
  return (
    <>
      <rect {...s} x="46" y="28" width="68" height="46" rx="8" />
      <path {...s} d="M66 28v-6a14 14 0 0 1 28 0v6" />
      <path {...s} d="M46 48h68" />
    </>
  );
}

function EventLines() {
  const s = stroke();
  return (
    <>
      <rect {...s} x="48" y="22" width="64" height="56" rx="8" />
      <path {...s} d="M48 40h64M68 22v-8M92 22v-8M64 54h12M64 64h24" />
    </>
  );
}

function LearnLines() {
  const s = stroke();
  return (
    <>
      <path {...s} d="M28 40 80 24l52 16-52 16L28 40Z" />
      <path {...s} d="M48 48v16c10 8 54 8 64 0V48" />
      <path {...s} d="M132 42v22" />
    </>
  );
}

function CityLines({ lake }: { lake: boolean }) {
  const s = stroke();
  return (
    <>
      <path {...s} d="M8 62 36 34l18 16 20-24 16 14 22-18 28 40" />
      <path {...s} d="M8 74h144" />
      {lake ? <path {...s} d="M18 80c18 8 36 8 54 0s36-8 54 0 22 6 28 2" /> : <path {...s} d="M52 62v12M70 54v20M96 48v26" />}
    </>
  );
}

function ProfileLines() {
  const s = stroke();
  return (
    <>
      <circle {...s} cx="80" cy="36" r="14" />
      <path {...s} d="M48 78c6-16 20-24 32-24s26 8 32 24" />
    </>
  );
}
