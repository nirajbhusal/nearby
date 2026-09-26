/** Soft abstract city / horizon sketch — can tint with place label */
export function CityHorizon({
  className = "w-full h-16",
  stroke = "currentColor",
  label,
}: {
  className?: string;
  stroke?: string;
  label?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 320 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
      >
        {/* Soft ground line */}
        <path
          d="M2 54.5c28-1.5 54 1 82-0.5 30-1.6 58 0.8 88 0.2 36-.7 70 1.2 106-0.4 14-.6 28 0.4 40 0.8"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Buildings — loose sketch strokes */}
        <path
          d="M28 54 V30 h14 v24"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <path
          d="M48 54 V22 h18 v32"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        <path
          d="M72 54 V36 h12 v18"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M98 54 V18 l10-6 10 6 v36"
          stroke={stroke}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
        <path
          d="M128 54 V28 h22 v26"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M158 54 V34 h16 v20"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M186 54 V14 h8 v4 h10 v36"
          stroke={stroke}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <path
          d="M214 54 V26 h20 v28"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M242 54 V38 h14 v16"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M264 54 V20 h16 v34"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Tiny window marks */}
        <path
          d="M54 30v2M54 36v2M58 30v2M58 36v2M106 28v2M112 28v2M192 26v2M192 32v2M220 34v2M270 28v2M274 28v2"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
      {label ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate px-1 text-center font-[family-name:var(--font-fraunces)] text-xs italic tracking-wide text-[var(--ink-muted)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
