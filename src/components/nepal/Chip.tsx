export function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={pressed ? "chip chip-on" : "chip"}
    >
      {children}
    </button>
  );
}

export function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs tracking-wide text-[var(--ink-faint)]">{label}</p>
      <div className="chip-row" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

export function CuratedNote() {
  return (
    <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
      Curated · last updated 26 Sep 2026. Drawn from public directories and
      official pages, not a field visit.
    </p>
  );
}
